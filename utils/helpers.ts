export const displayMessage = function(title: string, message: string, type: 'info' | 'warning' | 'error') {
  // TODO: Implement a better user feedback system, sweetalert is trash
  alert(`${title}\n${message}`)
}


/*
 * This funcion is needed since sidebase does not add the 
 * authentication token to $fetch and useFetch() methods automatically
 */
export const buildRequestHeaders = function(token: string | null) {
  if(!token) return

  return {
    authorization: token
  } as HeadersInit
}