import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import 'react-native-gesture-handler';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar as RNStatusBar,
  ActivityIndicator,
  ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';


// Importaciones de pantallas
import Registro from './Registro';
import R_Contraseña from './R_Contraseña';
import Menu_Principal from './Menu_Principal';
import Boton_Emergencia from './Boton_Emergencia';
import Mapa from './Mapa';
import Modulo_Informativo from './Modulo_Informativo';
import Reportes_Ciudadanos from './Reportes_Ciudadanos';
import Perfil from './Perfil';
import Registro_Contactos from './Registro_Contactos';
import Configuracion from './Configuracion';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
// imagen de fondo de pantañña
const BACKGROUND_IMAGE = require('../assets/Temis_Fondo.png');

// Componente del Drawer Content personalizado mejorado
function CustomDrawerContent(props) {
  const [activeRoute, setActiveRoute] = useState('Main');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Get current user info
    const user = auth.currentUser;
    if (user) {
      // Fetch user data from Firestore
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.name || 'Usuario');
            setUserEmail(user.email || '');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      fetchUserData();
    }
  }, []);

  const handleNavigation = (routeName) => {
    setActiveRoute(routeName);
    props.navigation.navigate(routeName);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      props.navigation.navigate('Login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión. Intenta nuevamente.');
    }
  };

  const menuItems = [
    { name: 'Main', label: 'Inicio', icon: 'home-outline' },
    { name: 'Boton_Emergencia', label: 'Botón de Emergencia', icon: 'alert-circle-outline' },
    { name: 'Mapa', label: 'Mapa de Zonas', icon: 'map-outline' },
    { name: 'Modulo_Informativo', label: 'Módulo Informativo', icon: 'information-circle-outline' },
    { name: 'Reportes_Ciudadanos', label: 'Reportes Ciudadanos', icon: 'document-text-outline' },
    { name: 'Perfil', label: 'Información Personal', icon: 'person-outline' },
    { name: 'Registro_Contactos', label: 'Contactos', icon: 'people-outline' },
    { name: 'Configuracion', label: 'Configuración', icon: 'settings-outline' },
  ];

  return (
    <SafeAreaView style={drawerStyles.container}>
      {/* Header mejorado */}
      <View style={drawerStyles.drawerHeader}>
        <View style={drawerStyles.logoContainer}>
          <View style={drawerStyles.logo}>
            <Ionicons name="shield-checkmark" size={28} color="#fff" />
          </View>
          <View style={drawerStyles.headerTextContainer}>
            <Text style={drawerStyles.drawerTitle}>TEMIS</Text>
            <Text style={drawerStyles.drawerSubtitle}>Seguridad, precaución y prevención</Text>
          </View>
        </View>

        {/* User Info */}
        <View style={drawerStyles.userInfo}>
          <View style={drawerStyles.userAvatar}>
            <Ionicons name="person" size={18} color="#49688d" />
          </View>
          <View style={drawerStyles.userTextContainer}>
            <Text style={drawerStyles.userName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={drawerStyles.userEmail} numberOfLines={1}>
              {userEmail}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView
        style={drawerStyles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[
              drawerStyles.drawerItem,
              activeRoute === item.name && drawerStyles.drawerItemActive
            ]}
            onPress={() => handleNavigation(item.name)}
          >
            <View style={drawerStyles.drawerItemContent}>
              <Ionicons
                name={item.icon}
                size={22}
                color={activeRoute === item.name ? '#49688d' : '#666'}
              />
              <Text style={[
                drawerStyles.drawerItemText,
                activeRoute === item.name && drawerStyles.drawerItemTextActive
              ]}>
                {item.label}
              </Text>
            </View>
            {activeRoute === item.name && (
              <View style={drawerStyles.activeIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Footer mejorado */}
      <View style={drawerStyles.drawerFooter}>
        <View style={drawerStyles.footerContent}>
          <Text style={drawerStyles.footerText}>¿Necesitas ayuda?</Text>
          <TouchableOpacity style={drawerStyles.helpButton}>
            <Ionicons name="help-circle-outline" size={18} color="#49688d" />
            <Text style={drawerStyles.helpText}>Centro de Ayuda</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={drawerStyles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={drawerStyles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Navigator del Drawer mejorado
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#49688d',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        drawerStyle: {
          width: 320,
        },
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.5)',
        headerStatusBarHeight: Platform.OS === 'ios' ? 0 : RNStatusBar.currentHeight,
      }}
    >
      <Drawer.Screen
        name="Main"
        component={Menu_Principal}
        options={{
          title: 'Inicio',
        }}
      />
      <Drawer.Screen
        name="Boton_Emergencia"
        component={Boton_Emergencia}
        options={{
          title: 'Botón de Emergencia',
        }}
      />
      <Drawer.Screen
        name="Mapa"
        component={Mapa}
        options={{
          title: 'Mapa de Zonas de Riesgo',
        }}
      />
      <Drawer.Screen
        name="Modulo_Informativo"
        component={Modulo_Informativo}
        options={{
          title: 'Módulo Informativo',
        }}
      />
      <Drawer.Screen
        name="Reportes_Ciudadanos"
        component={Reportes_Ciudadanos}
        options={{
          title: 'Reportes Ciudadanos',
        }}
      />
      <Drawer.Screen
        name="Perfil"
        component={Perfil}
        options={{
          title: 'Mi Perfil',
        }}
      />
      <Drawer.Screen
        name="Registro_Contactos"
        component={Registro_Contactos}
        options={{
          title: 'Contactos',
        }}
      />
      <Drawer.Screen
        name="Configuracion"
        component={Configuracion}
        options={{
          title: 'Configuración',
        }}
      />
    </Drawer.Navigator>
  );
}

// Pantalla de Login con Firebase Auth
function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, update last login and navigate to main app
        updateLastLogin(user.uid);
        navigation.navigate('Drawer');
      }
      setCheckingAuth(false);
    });

    return unsubscribe; // Cleanup subscription
  }, [navigation]);

  const updateLastLogin = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        lastLogin: new Date()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, llene todos los campos');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.toLowerCase().trim(),
        password
      );

      const user = userCredential.user;

      // Update last login time
      await updateLastLogin(user.uid);

      // Navigate to main app - the auth state listener will handle this
      // but we can also navigate here for immediate feedback
      navigation.navigate('Drawer');

    } catch (error) {
      console.error('Error en inicio de sesión:', error);

      let errorMessage = 'Error al iniciar sesión. Por favor, intenta nuevamente.';

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'El correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'La contraseña es incorrecta.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
          break;
        default:
          errorMessage = error.message;
      }

      Alert.alert('Error de Inicio de Sesión', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  if (checkingAuth) {
    return (
      // cambio de fondo de pantalla
      <ImageBackground source={BACKGROUND_IMAGE} style={styles.background}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Verificando sesión...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (

    <ImageBackground source={BACKGROUND_IMAGE} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingContainer} // Usar el nuevo estilo para el KAV
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.titulo}>TEMIS</Text>
              <View style={styles.titleUnderline} />
              <Text style={styles.texto}>Bienvenid@</Text>
            </View>

            {/* Login Form */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder='Correo Electrónico'
                  placeholderTextColor='#999'
                  value={email}
                  onChangeText={setEmail}
                  keyboardType='email-address'
                  autoCapitalize='none'
                  autoComplete='email'
                  editable={!loading}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder='Contraseña'
                  placeholderTextColor='#999'
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </View>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>¿Olvidó su Contraseña?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity
              style={[styles.registerLink, loading && styles.disabledLink]}
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
            >
              <Text style={styles.registerText}>
                ¿No tienes cuenta? <Text style={styles.registerTextBold}>Regístrate</Text>
              </Text>
            </TouchableOpacity>



            <StatusBar style='light' /> {/* Cambiado a light para contraste */}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

// Componente principal con navegación
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Registro} />
        <Stack.Screen name="ForgotPassword" component={R_Contraseña} />
        <Stack.Screen name="Drawer" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Estilos del Drawer mejorados
const drawerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  drawerHeader: {
    padding: 20,
    backgroundColor: '#49688d',
    borderBottomRightRadius: 0,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  drawerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  drawerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3eaf3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    color: '#49688d',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    color: '#7f8c8d',
    fontSize: 12,
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  drawerItem: {
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  drawerItemActive: {
    backgroundColor: '#f0f5ff',
  },
  drawerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  drawerItemText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  drawerItemTextActive: {
    color: '#49688d',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#49688d',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafbfc',
  },
  footerContent: {
    marginBottom: 15,
  },
  footerText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpText: {
    color: '#49688d',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  logoutButton: {
    backgroundColor: '#49688d',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
});


const styles = StyleSheet.create({

  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent', // Fondo transparente
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },

  keyboardAvoidingContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },

  titulo: {
    fontWeight: 'bold',
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#49688d',
    borderRadius: 2,
    marginBottom: 16,
  },

  texto: {
    fontWeight: '600',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 10,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    top: 15,
    zIndex: 1,
  },

  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    padding: 15,
    paddingLeft: 45,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },

  forgotPasswordText: {
    color: '#f0f0f0',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2
  },
  loginButton: {
    backgroundColor: '#49688d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerLink: {
    alignItems: 'center',
    marginBottom: 30,
  },
  disabledLink: {
    opacity: 0.5,
  },

  registerText: {
    color: '#f0f0f0',
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2
  },
  registerTextBold: {
    color: '#49688d',
    fontWeight: 'bold',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  separatorText: {
    marginHorizontal: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
});