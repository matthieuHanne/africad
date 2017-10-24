#! /home/mhanne/src/impexp/srv/venv/bin/python
# -*- coding:utf-8 -*-

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_rest_jsonapi import Api, ResourceDetail, ResourceList, ResourceRelationship
from flask_rest_jsonapi.exceptions import ObjectNotFound
from sqlalchemy.orm.exc import NoResultFound
from marshmallow_jsonapi.flask import Schema, Relationship
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from marshmallow_jsonapi import fields
from flask_cors import CORS

import os
import enum

app = Flask(__name__)
CORS(app)
app.config.from_object(os.environ['APP_SETTINGS'])
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
app.config['PAGE_SIZE'] = 30
db = SQLAlchemy(app)


# Create data storage
class Person(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    email = db.Column(db.String)
    birth_date = db.Column(db.Date)
    password = db.Column(db.String)


class ConditionEnum(enum.Enum):
    occasion = 0
    new = 1

class CategoryEnum(enum.Enum):
    car = 0
    moto = 1
    truck = 2

class Ad(db.Model): 
    id = db.Column(db.Integer, primary_key=True)
    person_id = db.Column(db.Integer, db.ForeignKey('person.id'))
    person = db.relationship('Person', backref=db.backref('ads'))
    title = db.Column(db.String)
    info = db.Column(db.String)
    price = db.Column(db.Integer)
    city = db.Column(db.String)
    location = db.Column(db.String)
    email = fields.Email(load_only=True)
    phone = db.Column(db.String)
    pics = db.Column(db.ARRAY(db.String))

    category = db.Column(db.Enum(CategoryEnum))
    @hybrid_property
    def meta_category(self):
        mcat = null
        if ['car', 'moto', 'truck', 'stuff', 'heavy'].contains(self.category):
            mcat = 'vehicles'
        return mcat

    #Vehicle attrs
    year = db.Column(db.String)
    mile = db.Column(db.String)
    ##moto
    cylinder = db.Column(db.String)
    ##car && truck
    make = db.Column(db.String)
    model = db.Column(db.String)
    fuel = db.Column(db.String)
    drive= db.Column(db.String)
    ##


db.create_all()


# Create logical data abstraction (same as data storage for this first example)
class PersonSchema(Schema):
    class Meta:
        type_ = 'person'
        self_view = 'person_detail'
        self_view_kwargs = {'id': '<id>'}
        self_view_many = 'person_list'

    id = fields.Integer(as_string=True, dump_only=True)
    name = fields.Str(requried=True, load_only=True)
    email = fields.Email(load_only=True)
    birth_date = fields.Date()
    display_name = fields.Function(lambda obj: "{} <{}>".format(obj.name.upper(), obj.email))
    ads = Relationship(self_view='person_ads',
            self_view_kwargs={'id': '<id>'},
            related_view='ad_list',
            related_view_kwargs={'id': '<id>'},
            many=True,
            schema='AdSchema',
            type_='ad')

class AdSchema(Schema):
    class Meta:
        type_ = 'Ad'
        self_view = 'ad_detail'
        self_view_kwargs = {'id': '<id>'}

    id = fields.Integer(as_string=True, dump_only=True)
    title = fields.Str(requried=True)
    info = fields.Str()
    price = fields.Integer(as_string=True)
    city = fields.Str()
    location = fields.Str()
    email = fields.Str()
    phone = fields.Str()
    pics = fields.Str()
    category = fields.Str()
    year = fields.Integer(as_string=True)
    mile = fields.Integer(as_string=True)
    cylinder = fields.Str()
    make = fields.Str()
    model = fields.Str()
    fuel = fields.Str()
    drive = fields.Str()
    create_by = Relationship(attribute='person',
        self_view='ad_person',
        self_view_kwargs={'id': '<id>'},
        related_view='person_detail',
        related_view_kwargs={'ad_id': '<id>'},
        schema='PersonSchema',
        type_='person')
    # Create resource managers
class PersonList(ResourceList):
    schema = PersonSchema
    data_layer = {'session': db.session,
            'model': Person}


class PersonDetail(ResourceDetail):
    def before_get_object(self, view_kwargs):
        if view_kwargs.get('ad_id') is not None:
            try:
                ad = self.session.query(Ad).filter_by(id=view_kwargs['ad_id']).one()
            except NoResultFound:
                raise ObjectNotFound({'parameter': 'ad_id'}, "Ad: {} not found".format(view_kwargs['ad_id']))
        else:
            if ad.person is not None:
                view_kwargs['id'] = aѕ.person.id
            else:
                view_kwargs['id'] = None

        schema = PersonSchema
        data_layer = {'session': db.session,
            'model': Person,
        'methods': {'before_get_object': before_get_object}}


class PersonRelationship(ResourceRelationship):
    schema = PersonSchema
    data_layer = {'session': db.session,
        'model': Person}

class AdList(ResourceList):
    def query(self, view_kwargs):
        query_ = self.session.query(Ad)
        if view_kwargs.get('id') is not None:
            try:
                self.session.query(Person).filter_by(id=view_kwargs['id']).one()
            except NoResultFound:
                raise ObjectNotFound({'parameter': 'id'}, "Person: {} not found".format(view_kwargs['id']))
            else:
                query_ = query_.join(Person).filter(Person.id == view_kwargs['id'])
        return query_

    def before_create_object(self, data, view_kwargs):
        if view_kwargs.get('id') is not None:
            person = self.session.query(Person).filter_by(id=view_kwargs['id']).one()
            data['person_id'] = person.id

    schema = AdSchema
    data_layer = {'session': db.session,
        'model': Ad,
        'methods': {'query': query,
            'before_create_object': before_create_object}}


class AdDetail(ResourceDetail):
    schema = AdSchema
    data_layer = {'session': db.session,
            'model': Ad}


class AdRelationship(ResourceRelationship):
    schema = AdSchema
    data_layer = {'session': db.session,
            'model': Ad}


    # Create endpoints

api = Api(app)
api.route(PersonList, 'person_list', '/persons')
api.route(PersonDetail, 'person_detail', '/persons/<int:id>', '/ads/<int:ad_id>/created_by')
api.route(PersonRelationship, 'person_ads', '/persons/<int:id>/relationships/ads')
api.route(AdList, 'ad_list', '/ads', '/persons/<int:id>/ads')
api.route(AdDetail, 'ad_detail', '/ads/<int:id>')
api.route(AdRelationship, 'ad_person', '/ads/<int:id>/relationships/created_by')

@app.route('/')
def index():
    return "Hello !"

if __name__ == '__main__':
    app.run(debug=True)
