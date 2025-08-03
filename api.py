from flask import Flask
from flask import request, jsonify
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
import enum
import uuid
from sqlalchemy.dialects.postgresql import UUID, ENUM, BYTEA, TIMESTAMP
from flask_restful import Resource, Api, reqparse, fields, marshal_with, abort
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS



app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://manal:1234@localhost/manaldb'
db = SQLAlchemy(app)
migrate = Migrate(app, db)
api = Api(app)
CORS(app)



#app models
class UserRole(enum.Enum):
    student = "student"
    admin   = "admin"

class ComplaintType(enum.Enum):
    academic      = "Academic"
    activities    = "activities"
    administrative= "administrative"
    IT            = "aT"

class ComplaintDep(enum.Enum):
    public  = "public"
    private = "private"

class ComplaintStatus(enum.Enum):
    under_checking = "under_checking"
    under_review   = "under_review"
    in_progress    = "in_progress"
    done           = "done"

class SessionStatus(enum.Enum):
    open  = "open"
    close = "close"

class SenderType(enum.Enum):
    bot  = "bot"
    user = "user"

# Models
class NotificationModel(db.Model):
    __tablename__ = "notifications"

    notification_id       = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id               = db.Column(UUID(as_uuid=True), db.ForeignKey("users.users_id", ondelete="CASCADE"))
    notifications_message = db.Column(db.Text, nullable=False)
    notification_created_at = db.Column(TIMESTAMP(timezone=True), server_default=db.func.now())
    notification_is_read  = db.Column(db.Boolean, default=False)

class ComplaintModel(db.Model):
    __tablename__ = "complaints"

    complaint_id       = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id          = db.Column(UUID(as_uuid=True), db.ForeignKey("users.users_id", ondelete="CASCADE"))
    complaint_type     = db.Column(ENUM(ComplaintType), nullable=False, default=ComplaintType.academic)
    complaint_dep      = db.Column(ENUM(ComplaintDep), nullable=False, default=ComplaintDep.private)
    complaint_status   = db.Column(ENUM(ComplaintStatus), nullable=False, default=ComplaintStatus.under_checking)
    complaint_title    = db.Column(db.String(100))
    complaint_message  = db.Column(db.Text, nullable=False)
    complaint_file     = db.Column(BYTEA)
    complaint_created_at= db.Column(TIMESTAMP(timezone=True), server_default=db.func.now())
    responder_id       = db.Column(UUID(as_uuid=True), db.ForeignKey("users.users_id", ondelete="SET NULL"))
    response_message   = db.Column(db.Text)
    response_created_at= db.Column(TIMESTAMP(timezone=True))

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

    suggestion_id        = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    users_id             = db.Column(UUID(as_uuid=True), db.ForeignKey("users.users_id", ondelete="CASCADE"))
    suggestion_type      = db.Column(ENUM(ComplaintType), nullable=False, default=ComplaintType.academic)
    suggestion_dep       = db.Column(ENUM(ComplaintDep), nullable=False, default=ComplaintDep.private)
    suggestion_title     = db.Column(db.String(100))
    suggestion_message   = db.Column(db.Text, nullable=False)
    suggestion_file      = db.Column(BYTEA)
    suggestion_created_at= db.Column(TIMESTAMP(timezone=True), server_default=db.func.now())

class ChatMessageModel(db.Model):
    __tablename__ = "chat_messages"

    chat_id     = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id  = db.Column(UUID(as_uuid=True), db.ForeignKey("chat_sessions.sessions_id", ondelete="CASCADE"))
    sender      = db.Column(ENUM(SenderType), nullable=False, default=SenderType.user)
    message     = db.Column(db.Text, nullable=False)
    created_at  = db.Column(TIMESTAMP(timezone=True), server_default=db.func.now())

class ChatSessionModel(db.Model):
    __tablename__ = "chat_sessions"

    sessions_id         = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    users_id            = db.Column(UUID(as_uuid=True), db.ForeignKey("users.users_id", ondelete="CASCADE"))
    session_created_at  = db.Column(TIMESTAMP(timezone=True), server_default=db.func.now())
    session_ended_at    = db.Column(TIMESTAMP(timezone=True))
    session_title       = db.Column(db.Text, nullable=False)
    session_status      = db.Column(ENUM(SessionStatus), nullable=False, default=SessionStatus.open)

    messages            = db.relationship("ChatMessageModel", backref="session", cascade="all,delete-orphan")

class UserModel(db.Model):
    __tablename__ = "users"

    users_id        = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    users_name      = db.Column(db.Text, nullable=False)
    users_email     = db.Column(db.Text, unique=True, nullable=False)
    users_password  = db.Column(db.String(200), nullable=False)
    users_role      = db.Column(ENUM(UserRole), nullable=False, default=UserRole.student)
    users_created_at= db.Column(TIMESTAMP(timezone=True), server_default=db.func.now())

    complaints_sent = db.relationship("ComplaintModel", backref="sender", foreign_keys="ComplaintModel.sender_id")
    complaints_resp = db.relationship("ComplaintModel", backref="responder", foreign_keys="ComplaintModel.responder_id")
    notifications   = db.relationship("NotificationModel", backref="user", cascade="all,delete-orphan")
    suggestions     = db.relationship("SuggestionModel", backref="user", cascade="all,delete-orphan")
    sessions        = db.relationship("ChatSessionModel", backref="user", cascade="all,delete-orphan")

user_args = reqparse.RequestParser()
user_args.add_argument('name', type = str, required = True, help = "Name cannot be blank")
user_args.add_argument('email', type = str, required = True, help = "Email cannot be blank")
user_args.add_argument('password', type=str, required=True, help='Password is required')
user_args.add_argument('role', type=str, choices=('student', 'admin'), required= True, help='Role must be student or admin')

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
        user = UserModel(users_name = args["name"], users_email = args["email"],
                         users_password = generate_password_hash(args["password"]),
                         users_role=UserRole(args["role"]) if args["role"] else UserRole.student)
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
    student_email = request.args.get("student_email")  # ✅ Get from query string

    if not student_email:
        return jsonify({"message": "Missing email"}), 400

    user = UserModel.query.filter_by(users_email=student_email).first()

    if not user:
        return jsonify([])  # Return an empty list if user not found

    complaints = ComplaintModel.query.filter_by(sender_id=user.users_id).all()
    complaints_data = [complaint.to_dict() for complaint in complaints]

    return jsonify(complaints_data)  # ✅ Return array of complaints

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
        sender_id=user.users_id  # FK relation
    )

    db.session.add(new_complaint)
    db.session.commit()

    return jsonify({"message": "Complaint submitted successfully."}), 201

@app.route('/api/get_admin_name/<admin_email>', methods=['GET'])
def get_admin_by_email(admin_email):
    admin = UserModel.query.filter_by(users_email=admin_email).first()
    if admin:
        return jsonify({
            'status': 'success',
            'name': admin.users_name,
            'admin_email': admin.users_email
        })
    else:
        return jsonify({'status': 'fail', 'message': 'Admin not found'}), 404
    
@app.route('/api/admin/get_all_students', methods=['GET'])
def get_all_students():
    students = UserModel.query.filter_by(users_role='student').all()
    student_list = []

    for student in students:
        student_list.append({
            "users_id": student.users_id,
            "users_name": student.users_name,
            "users_email": student.users_email
        })

    return jsonify(student_list)

@app.route('/api/admin/add_student', methods=['POST'])
def add_student():
    data = request.get_json()
    name = data.get('users_name')
    email = data.get('users_email')
    password = data.get('users_password')

    if not all([name, email, password]):
        return jsonify({'status': 'fail', 'message': 'Missing fields'}), 400

    existing_user = UserModel.query.filter_by(users_email=email).first()
    if existing_user:
        return jsonify({'status': 'fail', 'message': 'Email already exists'}), 409
    
    hashed_password = generate_password_hash(password)

    new_student = UserModel(
        users_name=name,
        users_email=email,
        users_password=hashed_password,  # Consider hashing passwords!
        users_role='student'
    )

    db.session.add(new_student)
    db.session.commit()

    return jsonify({'status': 'success', 'message': 'Student added successfully'})

@app.route('/api/admin/update_student', methods=['PUT'])
def update_student():
    data = request.get_json()
    old_email = data.get('old_email')
    new_name = data.get('new_name')
    new_password = data.get('new_password')
    new_email = data.get('new_email')

    student = UserModel.query.filter_by(users_email=old_email).first()
    if not student:
        return jsonify({'status': 'fail', 'message': 'Student not found'}), 404

    if new_name:
        student.users_name = new_name
    if new_password:
        hashed_password = hashed_password = generate_password_hash(new_password)
        student.users_password = hashed_password
    if new_email:
        student.users_email = new_email

    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Student updated successfully'})

@app.route('/api/admin_delete_student', methods=['DELETE'])
def delete_student():
    data = request.get_json()
    email = data.get('email')

    student = UserModel.query.filter_by(users_email=email).first()
    if not student:
        return jsonify({'status': 'fail', 'message': 'Student not found'}), 404

    db.session.delete(student)
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Student deleted successfully'})

@app.route('/api/admin/get_all_complaints', methods=['GET'])
def get_all_complaints():
    complaints = ComplaintModel.query.all()
    results = []

    for c in complaints:
        student_email = 'Unknown'
        
        # Check if the complaint is public and student exists
        if c.complaint_dep.name == "public":  # or c.complaint_dep.value == 'public' if `.value` gives you the raw string
            student = UserModel.query.filter_by(users_id=c.sender_id).first()
            if student:
                student_email = student.users_email
                print(str(c.complaint_type.name))

        results.append({
            'complaint_id': c.complaint_id,
            'complaint_title': c.complaint_title,
            'complaint_message': c.complaint_message,
            'complaint_dep' : str(c.complaint_dep.name),
            'complaint_type': str(c.complaint_type.name),
            'complaint_status': str(c.complaint_status.value),
            'complaint_date': c.complaint_created_at.strftime("%Y-%m-%d"),
            'response_message': c.response_message,
            'complaint_visibility': str(c.complaint_dep.value),
            'student_email': student_email
        })

    return jsonify(results)


@app.route('/api/admin/get_complaint', methods=['GET'])
def get_complaint_by_id():
    complaint_id = request.args.get('id')
    if not complaint_id:
        return jsonify({'status': 'fail', 'message': 'Complaint ID is required'}), 400

    try:
        uuid_obj = uuid.UUID(complaint_id)
        complaint = ComplaintModel.query.filter_by(complaint_id=uuid_obj).first()
    except ValueError:
        return jsonify({'status': 'fail', 'message': 'Invalid UUID format'}), 400

    if not complaint:
        return jsonify({'status': 'fail', 'message': 'Complaint not found'}), 404

    student = UserModel.query.filter_by(users_id=complaint.sender_id).first()

    return jsonify({
        'complaint_id': str(complaint.complaint_id),
        'complaint_title': complaint.complaint_title,
        'complaint_message': complaint.complaint_message,
        'complaint_type': str(complaint.complaint_type.name),
        'complaint_dep': str(complaint.complaint_dep),
        'complaint_status': str(complaint.complaint_status.name),
        'complaint_date': complaint.complaint_created_at,
        'response_message': complaint.response_message,
        'student_email': student.users_email if student and complaint.complaint_dep.name == "public" else "Unknown",
    })

@app.route('/api/admin/get_all_suggestions', methods=['GET'])
def get_all_suggestions():
    suggestion_dep = request.args.get('dep')  # مثلاً: public أو private

    if suggestion_dep and suggestion_dep.lower() in ['public', 'private']:
        suggestions = SuggestionModel.query.filter(SuggestionModel.suggestion_dep == suggestion_dep.lower()).all()
    else:
        suggestions = SuggestionModel.query.all()

    results = []

    for s in suggestions:
        student = UserModel.query.filter_by(users_id=s.users_id).first()
        student_email = student.users_email if student and s.suggestion_dep == 'public' else 'Unknown'

        results.append({
            'suggestion_id': s.suggestion_id,
            'suggestion_title': s.suggestion_title,
            'suggestion_message': s.suggestion_message,
            'suggestion_type': str(s.suggestion_type.value),
            'suggestion_dep': str(s.suggestion_dep.value),
            'suggestion_date': s.suggestion_created_at.strftime("%Y-%m-%d"),
            'student_email': student_email
        })

    return jsonify(results)


@app.route('/api/admin/get_suggestion', methods=['GET'])
def get_suggestion_by_id():
    suggestion_id = request.args.get('id')
    if not suggestion_id:
        return jsonify({'status': 'fail', 'message': 'Suggestion ID is required'}), 400

    try:
        uuid_obj = uuid.UUID(suggestion_id)
        suggestion = SuggestionModel.query.filter_by(suggestion_id=uuid_obj).first()
    except ValueError:
        return jsonify({'status': 'fail', 'message': 'Invalid UUID format'}), 400

    if not suggestion:
        return jsonify({'status': 'fail', 'message': 'Suggestion not found'}), 404

    student = UserModel.query.get(suggestion.users_id)

    return jsonify({
        'suggestion_id': str(suggestion.suggestion_id),
        'suggestion_title': suggestion.suggestion_title,
        'suggestion_message': suggestion.suggestion_message,
        'suggestion_type': str(suggestion.suggestion_type.value),
        'suggestion_dep': str(suggestion.suggestion_dep.value),
        'suggestion_date': suggestion.suggestion_created_at.isoformat(),
        'student_name': student.users_name if student else 'Unknown',
        'student_email': student.users_email if student and suggestion.suggestion_dep.value == 'public' else 'Unknown'
    })

@app.route('/api/admin/respond_suggestion', methods=['POST'])
def respond_to_suggestion():
    data = request.get_json()
    suggestion_id = data.get('suggestion_id')
    response_message = data.get('response_message')

    if not suggestion_id or not response_message:
        return jsonify({'status': 'fail', 'message': 'ID and response required'}), 400

    try:
        uuid_obj = uuid.UUID(suggestion_id)
        suggestion = SuggestionModel.query.filter_by(suggestion_id=uuid_obj).first()
    except ValueError:
        return jsonify({'status': 'fail', 'message': 'Invalid ID format'}), 400

    if not suggestion:
        return jsonify({'status': 'fail', 'message': 'Suggestion not found'}), 404

    suggestion.response_message = response_message
    db.session.commit()

    return jsonify({'status': 'success', 'message': 'Response saved'}), 200

@app.route('/api/admin/update_status', methods=['POST'])
def update_status():
    data = request.get_json()
    required_fields = ['complaint_id', 'new_status']

    if not all(k in data for k in required_fields):
        return jsonify({'status': 'fail', 'message': 'Missing required fields'}), 400

    try:
        complaint_id = uuid.UUID(data['complaint_id'])  # Ensure it's a UUID object
    except (ValueError, TypeError):
        return jsonify({'status': 'fail', 'message': 'Invalid complaint_id'}), 400

    complaint = ComplaintModel.query.filter_by(complaint_id=complaint_id).first()

    if not complaint:
        return jsonify({'status': 'fail', 'message': 'Complaint not found'}), 404

    try:
        complaint.complaint_status = ComplaintStatus(data['new_status'])
    except ValueError:
        return jsonify({'status': 'fail', 'message': 'Invalid complaint_status'}), 400

    db.session.commit()

    return jsonify({'status': 'success'})

@app.route('/api/admin/respond', methods=['POST'])
def respond_to_complaint():
    data = request.get_json()
    complaint_id = data.get('complaint_id')
    response_message = data.get('response_message')
    admin_id = data.get('admin_id')

    if not all([complaint_id, response_message, admin_id]):
        return jsonify({'status': 'fail', 'reason': 'Missing required fields'})

    complaint = ComplaintModel.query.get(complaint_id)

    if complaint and not complaint.response_message:
        complaint.response_message = response_message
        complaint.responder_id = admin_id  # <-- You must have this column in the model
        db.session.commit()
        return jsonify({'status': 'success'})
    else:
        return jsonify({'status': 'fail', 'reason': 'Invalid complaint or already responded'})

@app.route('/api/get_admin_id', methods=['GET'])
def get_admin_id():
    admin_email = request.args.get("admin_email")
    admin = UserModel.query.filter_by(users_email=admin_email).first()

    if admin:
        return jsonify({
            'status': 'success',
            'admin_id': admin.users_id
        })
    else:
        return jsonify({'status': 'fail', 'reason': 'Admin not found'})

if __name__ == '__main__':
    app.run(debug=True)