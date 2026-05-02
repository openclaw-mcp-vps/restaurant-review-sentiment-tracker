import * as React from "react";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function Card(
  { className = "", ...props },
  ref,
) {
  return <div ref={ref} className={`glass rounded-xl p-5 ${className}`.trim()} {...props} />;
});
