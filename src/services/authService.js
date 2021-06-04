import jwtDecode from 'jwt-decode';
import axios from 'src/utils/axios';

import firebase from 'firebase';

class AuthService {
  // Configure Firebase.
  config = {
    apiKey: 'AIzaSyBogaqI7q74Wml7AD90VVm_89o1cgFFQCo',
    authDomain: 'code-for-cause-leaders.firebaseapp.com',
    projectId: 'code-for-cause-leaders'
    // ...
  };

  // Configure FirebaseUI.
  uiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: 'popup',
    signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
    callbacks: {
      // Avoid redirects after sign-in.
      signInSuccessWithAuthResult: () => false
    }
  };

  firebase = firebase;

  user = {};

  setAxiosInterceptors = ({ onLogout }) => {
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          this.setSession(null);

          if (onLogout) {
            onLogout();
          }
        }

        return Promise.reject(error);
      }
    );
  };

  handleAuthentication() {
    // this.firebase.initializeApp(this.config);
    if (!firebase.apps.length) {
      // firebase.initializeApp({});
      this.firebase.initializeApp(this.config);
   }else {
      firebase.app(); // if already initialized, use that one
   }
  }

  signInWithEmailAndPassword(email, password) {
    return this.firebase.auth().signInWithEmailAndPassword(email, password);
  }

  login = () => {
    this.keycloak
      .init()
      .then(authenticated => {
        if (!authenticated) {
          this.keycloak.login();
        }
      })
      .catch(function(e) {
        console.log(e);
      });
  };

  loginInWithToken = () =>
    new Promise((resolve, reject) => {
      axios
        .get('/api/account/me')
        .then(response => {
          if (response.data.user) {
            resolve(response.data.user);
          } else {
            reject(response.data.error);
          }
        })
        .catch(error => {
          reject(error);
        });
    });

  logout = () => {
    this.firebase.auth().signOut();
    this.setSession(null);
  };

  setSession = accessToken => {
    if (accessToken) {
      console.log(accessToken);
      localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    } else {
      localStorage.removeItem('accessToken');
      delete axios.defaults.headers.common.Authorization;
    }
  };

  getAccessToken = () => localStorage.getItem('accessToken');

  isValidToken = accessToken => {
    if (!accessToken) {
      return false;
    }

    const decoded = jwtDecode(accessToken);
    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  };

  isAuthenticated = () => !!this.keycloak.authenticated;
}

const authService = new AuthService();

export default authService;
