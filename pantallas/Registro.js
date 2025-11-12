import React, { useState } from 'react';
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
import { db, auth } from '../firebase'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Registro({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Por favor, completa todos los campos');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
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
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save additional user data in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                role: 'user',
                status: 'active',
                emergencyContacts: [],
                profileCompleted: false
            });

            Alert.alert(
                '¡Éxito!',
                'Tu cuenta ha sido creada correctamente',
                [
                    {
                        text: 'Continuar',
                        onPress: () => navigation.navigate('Login')
                    }
                ]
            );

        } catch (error) {
            console.error('Error en registro:', error);
            
            let errorMessage = 'Error al crear la cuenta. Por favor, intenta nuevamente.';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este correo electrónico ya está registrado.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'El correo electrónico no es válido.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Demasiados intentos. Por favor, intenta más tarde.';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            Alert.alert('Error de Registro', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.titulo}>Crear Cuenta</Text>
                    <Text style={styles.subtitle}>
                        Regístrate para comenzar a usar TEMIS
                    </Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder='Nombre Completo'
                        placeholderTextColor='#999'
                        value={name}
                        onChangeText={setName}
                        editable={!loading}
                        returnKeyType="next"
                    />
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
                    <TextInput
                        style={styles.input}
                        placeholder='Contraseña'
                        placeholderTextColor='#999'
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        editable={!loading}
                        returnKeyType="next"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder='Confirmar Contraseña'
                        placeholderTextColor='#999'
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        editable={!loading}
                        returnKeyType="done"
                        onSubmitEditing={handleRegister}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.registerButton, loading && styles.disabledButton]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.loginLink, loading && styles.disabledLink]}
                    onPress={() => navigation.navigate('Login')}
                    disabled={loading}
                >
                    <Text style={styles.loginText}>
                        ¿Ya tienes cuenta? <Text style={styles.loginTextBold}>Inicia sesión</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
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
        color: '#2c3e50',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#7f8c8d',
        lineHeight: 22,
    },
    inputContainer: {
        marginBottom: 24,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    registerButton: {
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
    registerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginLink: {
        alignItems: 'center',
        marginBottom: 30,
    },
    disabledLink: {
        opacity: 0.5,
    },
    loginText: {
        color: '#7f8c8d',
        fontSize: 16,
        textAlign: 'center',
    },
    loginTextBold: {
        color: '#49688d',
        fontWeight: 'bold',
    },
});