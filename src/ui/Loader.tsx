
type LoaderProp = {
  value: number;
}

export const Loader: React.FC<LoaderProp> = ({ value }: LoaderProp) => {

  return (
    <div className="loading-progress-container" role="progress bar" aria-label="Metrics progress">
      <span>
        {value.toFixed(2)}%
      </span>
      <div className="loading-progress">
      </div>
    </div>
  );
}