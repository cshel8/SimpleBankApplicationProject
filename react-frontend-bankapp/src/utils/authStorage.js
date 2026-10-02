const ACCESS_TOKEN_KEY = 'simple-bank-access-token'

export function readAccessToken() {
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export function saveAccessToken(token) {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function removeAccessToken() {
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY)
}
