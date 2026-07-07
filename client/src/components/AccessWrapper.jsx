// src/components/AccessWrapper.js
import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';

const AccessWrapper = ({ children }) => {
  const today = new Date();
  const day = today.getDate();

  const isAllowed = day >= 1 && day <= 31;

  return isAllowed ? children : <Navigate to="/access" replace />;
};

AccessWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AccessWrapper;
