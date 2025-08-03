from flask import Flask, request, jsonify
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
import enum
import uuid
from sqlalchemy.dialects.postgresql import UUID, ENUM, BYTEA, TIMESTAMP
from flask_restful import Resource, Api, reqparse, fields, marshal_with, abort
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://omnia:1234@localhost:5432/complaintsdb'


db = SQLAlchemy(app)
migrate = Migrate(app, db)
api = Api(app)
CORS(app)

# Enums
class UserRole(enum.Enum):
    student = "student"
    admin = "admin"

class ComplaintType(enum.Enum):
    academic = "academic"
    activities = "activities"
    administrative = "administrative"
    IT = "IT"

class ComplaintDep(enum.Enum):
    public = "public"
    private = "private"

class ComplaintStatus(enum.Enum):
    under_checking = "under_checking"
    under_review = "under_review"
    in_progress = "in_progress"
    done = "done"

class SessionStatus(enum.Enum):
    open = "open"
    close = "close"

class SenderType(enum.Enum):
    bot = "bot"
    user = "user"

# Models
class NotificationModel(db.Model):
    __tablename__ = "notifications"
    notification_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.users_id", ondelete="CASCADE"))
    notifications_message = db.Column(db.Text, nullable=False)
    notification_created_at = db.Column(TIMESTAMP(timezone=True), server_default=db.func.now())
    notification_is_read = db.Column(db.Boolean, default=False)

class ComplaintModel(db.Model):
    __tablename__ = "complaints"
    complaint_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.users_id", ondelete="CASCADE"))
    complaint_type = db.Column(ENUM(ComplaintType), nullable=False, default=ComplaintType.academic)
    complaint_dep = db.Column(ENUM(ComplaintDep), nullable=False, default=ComplaintDep.private)
    complaint_status = db.Column(ENUM(ComplaintStatus), nullable=False, default=ComplaintStatus.under_checking)
    complaint_title = db.Column(db.String(100))
    complaint_message = db.Column(db.Text, nullable=False)
    complaint_file = db.Column(BYTEA)
    complaint_created_at = db.Column(TIMESTAMP(timezone=True), server_default=db.func.now())
    responder_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.users_id", ondelete="SET NULL"))
    response_message = db.Column(db.Text)
    response_created_at = db.Column(TIMESTAMP(timezone=True))

    def to_dict(self):
        return {
            "complaint_id": str(self.complaint_id),
            "sender_id": str(self.sender_id) if self.sender_id else None,
            "complaint_type": self.complaint_type.name if self.complaint_type else None,
            "complaint_dep": self.complaint_dep.name if self.complaint_dep else None,
            "complaint_status": self.complaint_status.name if self.complaint_status else None,
            "complaint_title": self.complaint_title,
            "complaint_message": self.complaint_message,
            "complaint_created_at": self.complaint_created_at.isoformat() if self.complaint_created_at else None,
            "responder_id": str(self.responder_id) if self.responder_id else None,
            "response_message": self.response_message if self.response_message else None,
            "response_created_at": self.response_created_at.isoformat() if self.response_created_at else None,
        }

class SuggestionModel(db.Model):
    __tablename__ = "suggestions"
    suggestion_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    users_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.users_id", ondelete="CASCADE"))
    suggestion_type = db.Column(ENUM(ComplaintType), nullable=False, default=ComplaintType.academic)
    suggestion_dep = db.Column(ENUM(ComplaintDep), nullable=False, default=ComplaintDep.private)
    suggestion_title = db.Column(db.String(100))
    suggestion_message = db.Column(db.Text, nullable=False)
    suggestion_file = db.Column(BYTEA)
    suggestion_created_at = db.Column(TIMESTAMP(timezone=True), server_default=db.func.now())

class ChatMessageModel(db.Model):
    __tablename__ = "chat_messages"
    chat_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = db.Column(UUID(as_uuid=True), db.ForeignKey("chat_sessions.sessions_id", ondelete="CASCADE"))
    sender = db.Column(ENUM(SenderType), nullable=False, default=SenderType.user)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(TIMESTAMP(timezone=True), server_default=db.func.now())

class ChatSessionModel(db.Model):
    __tablename__ = "chat_sessions"
    sessions_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    users_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.users_id", ondelete="CASCADE"))
    session_created_at = db.Column(TIMESTAMP(timezone=True), server_default=db.func.now())
    session_ended_at = db.Column(TIMESTAMP(timezone=True))
    session_title = db.Column(db.Text, nullable=False)
    session_status = db.Column(ENUM(SessionStatus), nullable=False, default=SessionStatus.open)
    messages = db.relationship("ChatMessageModel", backref="session", cascade="all,delete-orphan")

class UserModel(db.Model):
    __tablename__ = "users"
    users_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    users_name = db.Column(db.Text, nullable=False)
    users_email = db.Column(db.Text, unique=True, nullable=False)
    users_password = db.Column(db.String(200), nullable=False)
    users_role = db.Column(ENUM(UserRole), nullable=False, default=UserRole.student)
    users_created_at = db.Column(TIMESTAMP(timezone=True), server_default=db.func.now())
    complaints_sent = db.relationship("ComplaintModel", backref="sender", foreign_keys="ComplaintModel.sender_id")
    complaints_resp = db.relationship("ComplaintModel", backref="responder", foreign_keys="ComplaintModel.responder_id")
    notifications = db.relationship("NotificationModel", backref="user", cascade="all,delete-orphan")
    suggestions = db.relationship("SuggestionModel", backref="user", cascade="all,delete-orphan")
    sessions = db.relationship("ChatSessionModel", backref="user", cascade="all,delete-orphan")

# API Resources
user_args = reqparse.RequestParser()
user_args.add_argument('name', type=str, required=True, help="Name cannot be blank")
user_args.add_argument('email', type=str, required=True, help="Email cannot be blank")
user_args.add_argument('password', type=str, required=True, help='Password is required')
user_args.add_argument('role', type=str, choices=('student', 'admin'), required=True, help='Role must be student or admin')

userfields = {
    'users_id': fields.String(attribute='users_id'),
    'users_name': fields.String(attribute='users_name'),
    'users_email': fields.String(attribute='users_email'),
    'users_password': fields.String(attribute='users_password'),
    'users_role': fields.String(attribute='users_role')
}

class Users(Resource):
    @marshal_with(userfields)
    def get(self):
        users = UserModel.query.all()
        return users

    @marshal_with(userfields)
    def post(self):
        args = user_args.parse_args()
        user = UserModel(
            users_name=args["name"],
            users_email=args["email"],
            users_password=generate_password_hash(args["password"]),
            users_role=UserRole(args["role"])
        )
        db.session.add(user)
        db.session.commit()
        users = UserModel.query.all()
        return users, 201

api.add_resource(Users, '/api/addusers/')

@app.route("/")
def home():
    return '<h1>HI</h1>'

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = UserModel.query.filter_by(users_email=email).first()
    if user and check_password_hash(user.users_password, password):
        return jsonify({"message": "Login successful", "role": user.users_role.name}), 200
    else:
        return jsonify({"message": "Invalid email or password"}), 401

@app.route('/api/student/<email>', methods=['GET'])
def get_student_by_email(email):
    student = UserModel.query.filter_by(users_email=email).first()
    if student:
        return jsonify({
            'name': student.users_name,
            'email': student.users_email
        })
    else:
        return jsonify({'message': 'Student not found'}), 404

@app.route("/api/student/showcomplaints", methods=["GET"])
def get_complaints():
    student_email = request.args.get("student_email")
    if not student_email:
        return jsonify({"message": "Missing email"}), 400

    user = UserModel.query.filter_by(users_email=student_email).first()
    if not user:
        return jsonify([])

    complaints = ComplaintModel.query.filter_by(sender_id=user.users_id).all()
    complaints_data = [c.to_dict() for c in complaints]
    return jsonify(complaints_data)

@app.route('/api/student/addcomplaint', methods=['POST'])
def create_complaint():
    data = request.get_json()
    email = data.get('student_email')
    user = UserModel.query.filter_by(users_email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    new_complaint = ComplaintModel(
        complaint_title=data.get('complaint_title'),
        complaint_message=data.get('complaint_message'),
        complaint_type=data.get('complaint_type'),
        complaint_dep=data.get('complaint_dep'),
        sender_id=user.users_id
    )
    db.session.add(new_complaint)
    db.session.commit()
    return jsonify({"message": "Complaint submitted successfully."}), 201

@app.route("/api/student/showsuggestions", methods=["GET"])
def get_suggestions():
    student_email = request.args.get("student_email")
    if not student_email:
        return jsonify({"message": "Missing email"}), 400

    user = UserModel.query.filter_by(users_email=student_email).first()
    if not user:
        return jsonify([])

    suggestions = SuggestionModel.query.filter_by(users_id=user.users_id).all()
    suggestions_data = [
        {
            "suggestion_id": str(s.suggestion_id),
            "user_id": str(s.users_id),
            "suggestion_type": s.suggestion_type.name if s.suggestion_type else None,
            "suggestion_dep": s.suggestion_dep.name if s.suggestion_dep else None,
            "suggestion_title": s.suggestion_title,
            "suggestion_message": s.suggestion_message,
            "suggestion_created_at": s.suggestion_created_at.isoformat() if s.suggestion_created_at else None
        }
        for s in suggestions
    ]
    return jsonify(suggestions_data), 200

@app.route('/api/student/addsuggestion', methods=['POST'])
def create_suggestion():
    data = request.get_json()
    email = data.get('student_email')
    user = UserModel.query.filter_by(users_email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    new_suggestion = SuggestionModel(
        suggestion_title=data.get('suggestion_title'),
        suggestion_message=data.get('suggestion_message'),
        suggestion_type=data.get('suggestion_type'),
        suggestion_dep=data.get('suggestion_dep'),
        users_id=user.users_id
    )
    db.session.add(new_suggestion)
    db.session.commit()
    return jsonify({"message": "Suggestion submitted successfully."}), 201

if __name__ == '__main__':
    app.run(debug=True)
