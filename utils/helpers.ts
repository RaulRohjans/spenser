import { useToast } from 'vue-toastification'

export const displayMessage = function(message: string | undefined | null, type: 'info' | 'warning' | 'error' | 'success' = 'info') {
  // TODO: Implement a better user feedback system, sweetalert is trash
  //alert(`${title}\n${message}`)

  const toast = useToast()

  switch(type) {
    case 'error':
      toast.error(message)
      break
    case 'warning':
      toast.warning(message)
      break
    case 'info':
      toast.info(message)
      break
    case 'success': 
      toast.success(message)
      break
  }
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