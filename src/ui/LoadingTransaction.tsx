
type LoadingTransactionProp = {
  message?: string;
}

export const LoadingTransaction: React.FC<LoadingTransactionProp> = (
  {
    message = "Loading transactions..."
  }: LoadingTransactionProp
) => {

  return (
    <div className="dashboard-loading">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  )
}