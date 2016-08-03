import logging
import random

from sqlalchemy.exc import IntegrityError, InvalidRequestError

from community_share.models.search import Label, Search
from community_share.models.user import User, UserReview
from community_share.models.secret import Secret
from community_share.models.survey import Question, SuggestedAnswer
from community_share.models.conversation import Conversation, Message
from community_share.models.institution import InstitutionAssociation, Institution
from community_share.models.share import Share, Event, EventReminder
from community_share import store, Base, config, setup_data

logger = logging.getLogger(__name__)

skills = [
    'accounting',
    'biology',
    'cooking',
    'dinosaurs',
    'farming',
    'fish',
    'horses',
    'meteorology',
    'paleontology',
    'rockets',
]

first_names = [
    'Ai',
    'Antonia',
    'Antonio',
    'Bob',
    'Cary',
    'Charlotte',
    'Emma',
    'Esmerelda',
    'Ethelmay',
    'Ethelred',
    'Fang',
    'Fatima',
    'Joe',
    'John',
    'Mary',
    'Mina',
    'Mohammed',
    'Pedro',
    'Pierre',
    'Robert',
    'Rufus',
    'Sam',
    'Susan',
]

last_names = [
    'Campbell',
    'Carter',
    'Davis',
    'Evans',
    'Garcia',
    'Gonzalez',
    'Johnson',
    'Jones',
    'King',
    'Lopez',
    'Perez',
    'Robinson',
    'Rodriguez',
    'Smith',
    'Walker',
    'White',
    'Williams',
    'Wright',
    'Wu',
]

labels = {
    'GradeLevels': [
        'K-5', '6-8', '9-12', 'College', 'Adult',
    ],
    'SubjectAreas': [
        'STEM', 'Arts',
        'Science', 'Technology', 'Engineering', 'Math',
        'Visual Arts', 'Digital Media', 'Film & Photography', 'Literature',
        'Performing Arts',
        'Social Studies', 'English/Language Arts', 'Foreign Languages', 'PE/Health/Sports',
        'Mathematics', 'Goverment',
    ],
    'LevelOfEngagement': [
        'Guest', 'Speaker', 'Field Trip Host', 'Student Competition Judge',
        'Individual/Group Mentor', 'Share Curriculum Ideas', 'Curriculuum Development',
        'Career Day Participant', 'Collaborator on a Class Project'
    ],
}

label_probabilities = [
    (labels['GradeLevels'], 0.5),
    (labels['SubjectAreas'], 0.2),
    (labels['LevelOfEngagement'], 0.2),
    (skills, 0.3),
]


profile_picture_filenames = [
    'aardvark.jpg',
    'ant.jpg',
    'dolphin.jpg',
    'gila_monster.jpg',
    'honey_badger.jpg',
    'llama.jpg',
    'octopus.jpg',
    'pig.jpg',
    'shiba.jpg',
    'sloth.jpg',
]

school_infos = [
    ('School Number 42', 'School'),
    ('School Number 101', 'School')
]

educator_roles = [
    'Classroom Teacher',
    'Curriculum Coordinator',
]

partner_roles = [
    'CEO',
    'Engineer',
    'Intern',
    'Sales Representative',
]

company_infos = [
    ('Big University', 'University'),
    ('Acme', 'Company'),
    ('City Opera', 'Nonprofit'),
    ('Widget Factory', 'Company'),
    ('Secret Government Research Lab', 'Government'),
    ('Myself', 'Freelancer'),
    ('Copper Mine', 'Company'),
]

specialties = [
    'classical portraiture',
    'interpretative dance',
    'laying fiber-optic cable',
    'mass-surveillance',
    'postmodern composition',
    'robotic molluscs',
]

hobbies = [
    'underwater skiing.',
    'playing competitive hide-and-seek.',
    'playing minecraft',
    'french cooking',
    'watching reality TV',
    'training for marathons',
    'juggling'
]

def gen_email(first_name, last_name):
    return '{0}.{1}@example.com'.format(first_name, last_name)

def gen_labels():
    return [
        label
        for label_set, probability in label_probabilities
        for label in label_set
        if random.random() < probability
    ]

def make_institutions(infos):
    return [
        Institution(name=name,institution_type=institution_type)
        for name, institution_type in infos
    ]

companies = make_institutions(company_infos)
schools = make_institutions(school_infos)

def generate_expert_bio():
    specialty = random.choice(specialties)
    hobby = random.choice(hobbies)
    return "I specialize in the area of {0}.  My main hobby is {1}.".format(specialty, hobby)

def generate_educator_bio():
	bio = "My main hobby is {0}".format(random.choice(hobbies))
	return bio

def make_random_location():
    latitude = 32.223303 + (random.random()-0.5)+0.1
    longitude = -110.970905 + (random.random()-0.5)+0.1
    return (latitude, longitude)

user_names_used = set()

def gen_new_name(existing_users, first_names, last_names):
    max_combinations = len(first_names) * len(last_names)

    # stop trying after a while to keep from infinite iteration
    for attempt_count in range(max_combinations):
        name_pair = (random.choice(first_names), random.choice(last_names))
        if name_pair not in existing_users:
            return name_pair

    return None, None

def gen_random_institution(institutions, roles):
    return InstitutionAssociation(
        institution=random.choice(institutions),
        role=random.choice(roles)
    )

def make_random_user():
    # Make the user
    first_name, last_name = gen_new_name(user_names_used, first_names, last_names)

    if first_name is None:
        return

    user_names_used.add((first_name, last_name))

    password = Secret.make_key(20)
    password_hash = User.pwd_context.encrypt(password)

    if random.randint(0, 1):
        searcher_role = 'educator'
        searching_for_role = 'partner'
        bio = generate_educator_bio()
        associations = [
            gen_random_institution(schools, educator_roles)
        ]
    else:
        searcher_role = 'partner'
        searching_for_role = 'educator'
        bio = generate_expert_bio()
        associations = [
            gen_random_institution(companies, partner_roles)
            for _ in range(random.randint(1, 2))
        ]

    new_user = User(
        name='{0} {1}'.format(first_name, last_name),
        email=gen_email(first_name, last_name),
        password_hash=password_hash,
        picture_filename=random.choice(profile_picture_filenames),
        bio=bio,
        institution_associations=associations,
        is_administrator=False,
        email_confirmed=True
    )

    store.session.add(new_user)
    store.session.commit()

    # Make the search
    latitude, longitude = make_random_location()
    search = Search(
        searcher_user_id=new_user.id,
        searcher_role=searcher_role,
        searching_for_role=searching_for_role,
        latitude=latitude,
        longitude=longitude,
    )
    search.labels = Label.name_list_to_object_list(gen_labels())

    store.session.add(search)
    store.session.commit()

    if search.searcher_role == 'educator':
        new_user.educator_profile_search = search
    else:
        new_user.community_partner_profile_search = search

    store.session.add(new_user)
    store.session.commit()

def make_labels():
    all_labels = labels['GradeLevels'] + labels['SubjectAreas'] + labels['LevelOfEngagement']
    for name in all_labels:
        label = Label(name=name)
        store.session.add(label)
        try:
            store.session.commit()
        except (IntegrityError, InvalidRequestError):
            store.session.rollback()


def make_admin_user(name, email, password):
    password_hash = User.pwd_context.encrypt(password)
    new_user = User(name=name, email=email, password_hash=password_hash,
                    is_administrator=True, email_confirmed=True)
    store.session.add(new_user)
    try:
        store.session.commit()
    except (IntegrityError, InvalidRequestError):
        store.session.rollback()
        new_user = None
    return new_user

def update_questions(questions):
    new_hashs = set([question.make_hash() for question in questions])
    existing_questions = store.session.query(Question).filter(Question.active == True).all()
    old_hashs = set([question.make_hash() for question in existing_questions])
    hashs_to_add = new_hashs - old_hashs
    hashs_to_delete = old_hashs - new_hashs
    for question in existing_questions:
        if question.make_hash() in hashs_to_delete:
            question.active = False
            store.session.add(question)
    for question in questions:
        if question.make_hash() in hashs_to_add:
            store.session.add(question)

def init_db():
    Base.metadata.reflect(store.engine)
    logger.info('Dropping all tables.')
    Base.metadata.drop_all(store.engine);
    logger.info('Creating all tables.')
    Base.metadata.create_all(store.engine);

def update_db():
    Base.metadata.reflect(store.engine)
    logger.info('Creating all tables.')
    Base.metadata.create_all(store.engine, checkfirst=True);
    logger.info('Created all tables.')

def get_creator():
    admin_emails = config.ADMIN_EMAIL_ADDRESSES.split(',')
    admin_emails = [x.strip() for x in admin_emails]
    admin_user = None
    for admin_email in admin_emails:
        admin_user = store.session.query(User).filter(
            User.active==True, User.email==admin_email).first()
        if admin_user is not None:
            break
    return admin_user

def setup(n_random_users=100):
    logger.info('Starting setup script.')
    init_db()
    logger.info('Making labels.')
    make_labels()
    from community_share.models.secret import Secret

    logger.info('Making Admin Users')
    make_admin_user('admin@example.com', 'admin@example.com', 'admin')
    admin_emails = config.ADMIN_EMAIL_ADDRESSES.split(',')
    admin_emails = [x.strip() for x in admin_emails]
    logger.info('admin_emails is {0}'.format(admin_emails))
    for email in admin_emails:
        make_admin_user(email, email, Secret.make_key(20))

    logger.info('Making {0} random users'.format(n_random_users))
    for i in range(n_random_users):
        make_random_user()
    creator = get_creator()
    logger.info('Creator of questions is {}'.format(creator.email))
    questions = setup_data.get_questions(creator)
    update_questions(questions)
    store.session.commit()
    creator = get_creator()
    questions = setup_data.get_questions(creator)
    update_questions(questions)
    store.session.commit()

if __name__ == '__main__':
    logger.info('Loading settings from environment')
    config.load_from_file()
    logger.info('Finished loading settings')
    setup(n_random_users=40)
