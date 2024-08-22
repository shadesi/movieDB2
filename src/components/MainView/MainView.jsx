// src/components/main-view/main-view.jsx

import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import MovieCard from '../movie-card/movie-card';
import './main-view.scss';

export const MainView = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch movie data from the myFlix API
    fetch('https://movie-api-4o5a.onrender.com/movies')  // Replace with your own API URL
      .then((response) => response.json())
      .then((data) => {
        setMovies(data); // Update state with the fetched movies
        setLoading(false);
      })
      .catch((error) => {
        setError('Failed to fetch movie data');
        setLoading(false);
      });
  }, []);  // Empty dependency array ensures this effect runs once on component mount

  if (loading) return <div>Loading movies...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Container>
      <Row>
        {movies.map((movie) => (
          <Col key={movie._id} xs={12} sm={6} md={4} lg={3}>
            <MovieCard movie={movie} />
          </Col>
        ))}
      </Row>
    </Container>
  );
};
