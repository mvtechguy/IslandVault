import React from 'react';

export default function DebugCreate() {
  console.log("DebugCreate component is rendering");
  
  return (
    <div style={{
      backgroundColor: 'lime', 
      padding: '20px', 
      margin: '20px', 
      minHeight: '500px',
      border: '5px solid purple',
      fontSize: '24px'
    }}>
      <h1 style={{color: 'black', fontSize: '32px'}}>SIMPLE CREATE PAGE TEST</h1>
      <p style={{color: 'black'}}>If you see this, the routing is working</p>
      <p style={{color: 'black'}}>Current time: {new Date().toLocaleTimeString()}</p>
      <button style={{
        padding: '15px 30px', 
        backgroundColor: 'blue', 
        color: 'white',
        fontSize: '18px',
        border: 'none',
        borderRadius: '5px'
      }}>
        TEST BUTTON
      </button>
    </div>
  );
}