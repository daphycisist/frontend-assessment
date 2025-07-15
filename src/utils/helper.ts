
export function formatTransactionCount<T>(content: T[] | T): string {
  let count = ''; 
  const length = Array.isArray(content) ? content?.length : content as number;
  if(length <= 999){
    if(Array.isArray(content)){
      if(length == 1 && content[0] == '') count = '0'
      else count = length.toString()
    }
    else count = length.toString()
  }
  else if(length > 999 && length <= 999_999)
    count = ((length / 1000).toFixed(1)).toString() + 'K'
  else if(length > 999_999 && length <= 999_999_999)
    count = ((length / 1000_000).toFixed(1)).toString() + 'M'
  else if(length > 999_999_999)
    count = ((length / 1000_000_000).toFixed(1)).toString() + 'B'
  return count
}
