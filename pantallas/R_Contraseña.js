import React, { useState } from 'react'; // Importar useState explícitamente
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';

// Importar funciones de Firebase
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase'; // Asume que 'auth' está exportado de './firebase'

export default function R_Contraseña({ navigation }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false); // Estado para el indicador de carga

    const handleRecovery = async () => { // Hacer la función asíncrona
        if (!email || email.trim() === '') {
            Alert.alert('Error', 'Por favor, ingresa tu correo electrónico.');
            return;
        }

        // Validación básica de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Por favor, ingresa un correo electrónico válido.');
            return;
        }

        setLoading(true); // Mostrar indicador de carga

        try {
            // Llamada a la función de Firebase para enviar el correo
            await sendPasswordResetEmail(auth, email.toLowerCase().trim());

            Alert.alert(
                'Correo Enviado',
                `Se ha enviado un enlace de recuperación a ${email}. Por favor, revisa tu bandeja de entrada y la carpeta de SPAM.`
            );

            // Navegar de vuelta al login
            navigation.navigate('Login');

        } catch (error) {
            console.error('Error al restablecer contraseña:', error.code, error.message);

            let errorMessage = 'Hubo un error al intentar enviar el correo. Por favor, verifica la dirección.';

            // Manejo de errores específicos
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
                // Por seguridad, damos un mensaje genérico.
                errorMessage = 'Si la cuenta existe, recibirás un correo en breve con las instrucciones.';
            }

            Alert.alert('Error de Recuperación', errorMessage);

        } finally {
            setLoading(false); // Ocultar indicador de carga
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.titulo}>Recuperar Contraseña</Text>
                <Text style={styles.subtitulo}>Ingresa tu correo electrónico para recibir instrucciones de recuperación</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder='Correo Electrónico'
                        placeholderTextColor='#999'
                        value={email}
                        onChangeText={setEmail}
                        keyboardType='email-address'
                        autoCapitalize='none'
                        editable={!loading} // Deshabilita el input mientras carga
                    />
                </View>

                <TouchableOpacity
                    style={[styles.recoveryButton, loading && styles.disabledButton]}
                    onPress={handleRecovery}
                    disabled={loading} // Deshabilita el botón mientras carga
                >
                    {loading ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={styles.recoveryButtonText}>Enviar Enlace de Recuperación</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.loginLink}
                    onPress={() => navigation.navigate('Login')}
                    disabled={loading}
                >
                    <Text style={styles.loginText}>Volver al Inicio de Sesión</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({

    recoveryButton: {
        backgroundColor: '#49688d', 
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginBottom: 15,
    },
    recoveryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#cccccc', 
    },
    // ... el resto de tus estilos
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    titulo: {
        fontWeight: 'bold',
        fontSize: 28,
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    subtitulo: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
        color: '#666',
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    loginLink: {
        alignItems: 'center',
        marginBottom: 30,
    },
    loginText: {
        color: '#49688d', 
        fontSize: 16,
    },
});
