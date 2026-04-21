import React from 'react';

interface TwoColumnsContainerProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

const TwoColumnsContainer: React.FC<TwoColumnsContainerProps> = ({ left, right }) => (
  <div className="Two-Columns-Container">
    {left}
    {right}
  </div>
);

export default TwoColumnsContainer;
