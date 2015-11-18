from geojson import Feature, FeatureCollection
from geomet import wkt
import json
import psycopg2
import requests

# from sqlalchemy import Column, String, Integer, Float
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy.ext.declarative import declarative_base

# from geoalchemy2 import Geometry

from flask import Flask
from flask import request
from flask.ext.cors import CORS


# Base = declarative_base()
# class District(Base):
#     __tablename__ = 'districts'
#     id = Column(Integer, primary_key=True)
#     statefp = Column(String)
#     cd114fp = Column(String)
#     geoid = Column(String)
#     namelsad = Column(String)
#     aland = Column(Float)
#     awater = Column(Float)
#     lat = Column(Float)
#     lon = Column(Float)
#     geom = Column(Geometry('MULTIPOLYGON'))
#
#     def __str__(self):
#         return self.namelsad
#
#     def __repr__(self):
#         return self.namelsad
#
#
# def get_session():
#     engine = create_engine('postgresql://tigren@localhost/cd113')
#     Session = sessionmaker(bind=engine)
#     return Session()


app = Flask(__name__)
CORS(app)
# session = get_session()
conn = psycopg2.connect(database="cd113", user="tigren", host="192.168.1.18")
c = conn.cursor()


def get_simplify_factor(zoom):
    zoom = int(zoom)
    if zoom < 6:
        return .05
    elif zoom == 6:
        return .01
    elif zoom == 7:
        return .005
    elif zoom == 8:
        return .0025
    elif zoom == 9:
        return .001
    elif zoom > 14:
        return 0.0001
    else:
        return .0005


def get_state_abbr(statefp):
    states = {'09': 'CT', '51': 'VA', '50': 'VT', '19': 'IA', '26': 'MI', '35': 'NM', '04': 'AZ', '02': 'AK',
              '25': 'MA', '23': 'ME', '01': 'AL', '20': 'KS', '21': 'KY', '48': 'TX', '05': 'AR', '46': 'SD',
              '47': 'TN', '08': 'CO', '45': 'SC', '42': 'PA', '29': 'MO', '40': 'OK', '41': 'OR', '27': 'MN',
              '18': 'IN', '28': 'MS', '24': 'MD', '39': 'OH', '38': 'ND', '72': 'PR', '30': 'MT', '06': 'CA',
              '11': 'DC', '10': 'DE', '13': 'GA', '12': 'FL', '15': 'HI', '22': 'LA', '17': 'IL', '16': 'ID',
              '55': 'WI', '54': 'WV', '31': 'NE', '56': 'WY', '37': 'NC', '36': 'NY', '53': 'WA', '34': 'NJ',
              '33': 'NH', '32': 'NV', '49': 'UT', '44': 'RI'}
    return states.get(statefp, 'Unknown')


def get_state(statefp):
    states = {
        "01": "Alabama",
        "02": "Alaska",
        "04": "Arizona",
        "05": "Arkansas",
        "06": "California",
        "08": "Colorado",
        "09": "Connecticut",
        "10": "Delaware",
        "11": "District of Columbia",
        "12": "Florida",
        "13": "Geogia",
        "15": "Hawaii",
        "16": "Idaho",
        "17": "Illinois",
        "18": "Indiana",
        "19": "Iowa",
        "20": "Kansas",
        "21": "Kentucky",
        "22": "Louisiana",
        "23": "Maine",
        "24": "Maryland",
        "25": "Massachusetts",
        "26": "Michigan",
        "27": "Minnesota",
        "28": "Mississippi",
        "29": "Missouri",
        "30": "Montana",
        "31": "Nebraska",
        "32": "Nevada",
        "33": "New Hampshire",
        "34": "New Jersey",
        "35": "New Mexico",
        "36": "New York",
        "37": "North Carolina",
        "38": "North Dakota",
        "39": "Ohio",
        "40": "Oklahoma",
        "41": "Oregon",
        "42": "Pennsylvania",
        "44": "Rhode Island",
        "45": "South Carolina",
        "46": "South Dakota",
        "47": "Tennessee",
        "48": "Texas",
        "49": "Utah",
        "50": "Vermont",
        "51": "Virginia",
        "53": "Washington",
        "54": "West Virginia",
        "55": "Wisconsin",
        "56": "Wyoming"
    }
    return states.get(statefp, 'Unknown')


@app.route('/', methods=['GET'])
def district_geometry():
    simplify = get_simplify_factor(request.args.get('zoom'))
    districts = c.execute(
        'SELECT id, statefp, cd114fp, geoid, namelsad, ST_AsText(ST_Simplify(geom, %s)) from districts', (simplify,))
    districts = c.fetchall()
    fc = FeatureCollection([Feature(geometry=wkt.loads(x[-1]), properties={'id': str(x[0])}) for x in districts])
    return json.dumps(fc)


@app.route('/district/', methods=['GET'])
def get_opensecrets():
    idcode = request.args.get('idcode')
    url = 'http://www.opensecrets.org/api/'
    params = {'apikey': '47729c2bc4bb96717eff0fdf61ae1b37',
              'method': 'getLegislators',
              'output': 'json',
              'id': idcode}
    data = requests.get(url, params=params)
    return json.dumps(data.json()['response']['legislator'])


@app.route('/bbox/', methods=['GET'])
def cdistrict_bbox():
    bbox = request.args.get('bbox')
    zoom = request.args.get('zoom')
    simplify = get_simplify_factor(zoom)
    bounds = [float(x) for x in bbox.split(',')]
    districts = c.execute(
        'SELECT id, statefp, cd114fp, geoid, namelsad, ST_AsText(ST_Simplify(geom, %s)) from districts WHERE ST_MakeEnvelope(%s,%s,%s,%s) && geom',
        [simplify] + bounds)
    districts = c.fetchall()
    fc = FeatureCollection([Feature(geometry=wkt.loads(x[-1]), properties={'id': str(x[0]),
                                                                           'state': get_state(x[1]),
                                                                           'stateabbr': get_state_abbr(x[1]),
                                                                           'statefp': x[1],
                                                                           'cd114fp': x[2],
                                                                           'geoid': x[3],
                                                                           'namelsad': x[4]}) for x in districts])
    return json.dumps(fc)


if __name__ == '__main__':
    app.run(debug=True, host='192.168.1.18')
