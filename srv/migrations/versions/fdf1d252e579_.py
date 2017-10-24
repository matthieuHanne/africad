"""empty message

Revision ID: fdf1d252e579
Revises: cf412a4506f2
Create Date: 2017-10-22 20:20:50.034519

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fdf1d252e579'
down_revision = 'cf412a4506f2'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('ad_person_id_fkey', 'ad', type_='foreignkey')
    op.drop_column('ad', 'person_id')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('ad', sa.Column('person_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.create_foreign_key('ad_person_id_fkey', 'ad', 'person', ['person_id'], ['id'])
    # ### end Alembic commands ###
