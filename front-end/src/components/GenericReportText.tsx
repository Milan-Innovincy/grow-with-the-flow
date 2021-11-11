import React from "react";

type Props = {
  label?: string;
  body: string;
};

export const GenericReportText: React.FC<Props> = ({ label, body }) => {
  return (
    <div>
      {label && <h2>${label}</h2>}
      <p>
        ${body}
      </p>
    </div>
  );
};

