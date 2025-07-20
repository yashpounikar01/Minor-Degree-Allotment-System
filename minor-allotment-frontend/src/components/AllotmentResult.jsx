import React, { useEffect, useState } from 'react';
import { getAllotmentResult } from '../api';
import './AllotmentResult.css'; // link to custom CSS

const AllotmentResult = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    getAllotmentResult()
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="allotment-container">
      <h2>📋 Allotment Result</h2>
      <div className="table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>ERPID</th>
              <th>Name</th>
              <th>Avg %</th>
              <th>Allotted Branch</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ erpid, name, avg_percent, allotted_branch, rank }) => (
              <tr key={erpid}>
                <td>{rank}</td>
                <td>{erpid}</td>
                <td>{name}</td>
                <td>{avg_percent}</td>
                <td className="branch">{allotted_branch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllotmentResult;
