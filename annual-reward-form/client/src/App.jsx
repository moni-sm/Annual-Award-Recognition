// import React from 'react';
// import NominationForm from './components/NominationForm';

// function App() {
//   return <NominationForm />;
// }

// export default App;


import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NominationForm from './components/NominationForm';
import AccessGate from './components/AccessGate';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={ <NominationForm />} />
        <Route path="/access" element={<AccessGate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
