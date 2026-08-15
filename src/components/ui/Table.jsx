import React from 'react';
import './Table.css';

export const Table = ({ children, className = '' }) => {
  return (
    <div className="biz-table-container">
      <table className={`biz-table ${className}`}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children }) => {
  return <thead>{children}</thead>;
};

export const TableBody = ({ children }) => {
  return <tbody>{children}</tbody>;
};

export const TableRow = ({ children, className = '', onClick }) => {
  return (
    <tr 
      className={`biz-table-row ${onClick ? 'clickable' : ''} ${className}`} 
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({ children, className = '' }) => {
  return <th className={`biz-table-head ${className}`}>{children}</th>;
};

export const TableCell = ({ children, className = '' }) => {
  return <td className={`biz-table-cell ${className}`}>{children}</td>;
};
