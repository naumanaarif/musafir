from sqlalchemy import Column, String, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class TransportMetadata(Base):
    __tablename__ = 'transport_metadata'

    mode_id = Column(String, primary_key=True)
    display_name = Column(String)
    category = Column(String)
    base_fare = Column(Integer, default=0)

    routes = relationship("Route", back_populates="metadata_mode")

class Stop(Base):
    __tablename__ = 'stops'

    stop_id = Column(String, primary_key=True)
    name_en = Column(String)
    name_ur = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    route_stops = relationship("RouteStop", back_populates="stop")

class Route(Base):
    __tablename__ = 'routes'

    route_id = Column(String, primary_key=True)
    mode_id = Column(String, ForeignKey('transport_metadata.mode_id'))
    name = Column(String)
    origin = Column(String)
    destination = Column(String)
    stop_count = Column(Integer)
    source_url = Column(String)
    image_url = Column(String)

    metadata_mode = relationship("TransportMetadata", back_populates="routes")
    route_stops = relationship("RouteStop", back_populates="route", order_by="RouteStop.sequence_order")

class RouteStop(Base):
    __tablename__ = 'route_stops'

    path_id = Column(String, primary_key=True)
    route_id = Column(String, ForeignKey('routes.route_id'))
    stop_id = Column(String, ForeignKey('stops.stop_id'))
    sequence_order = Column(Integer)

    route = relationship("Route", back_populates="route_stops")
    stop = relationship("Stop", back_populates="route_stops")
