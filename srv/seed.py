from api import *

def _(record):
    '''Boilerplate control function'''
    db.session.add(record)
    return record
user1 = _(Person(name='Matthieu', email='matthieu.hanne@gmail.com'))
user2 = _(Person(name='Ines', email='matthieu.hanne@gmail.com'))

car = _(Ad(
    person=user1,
    category='car',
    title='Grand c4 picasso 150',
    price='150000',
    city='Abidjan',
    phone='0168156921',
    email='matthieu.hanne@gmail.com',
    pics=[
        'https://img6.leboncoin.fr/ad-image/e48dd1d08f9b21090ece42e3fd2a06c89ef0a00a.jpg',
        'https://img5.leboncoin.fr/ad-large/40a93dbf5a8d1d7669ad7c851f94f5aff6cb5449.jpg',
        'https://img0.leboncoin.fr/ad-large/6f7d477b788981aed75ec87999b17613958e872e.jpg',
        ],
    info='CITROEN GRAND C4 PICASSO \n II 2.0 BLUEHDI 150 EXCLUSIVE BVA \n 85 695 km \n Diesel \n 8CV - 03 / 10 / 2014 \n     Véhicule garanti 12 mois',
    make="Citroen",
    model='C4',
    year='2014',
    mile='85000'))

ad2 = _(Ad(person=user2,title='title2', info='blablabla'))

db.session.commit()