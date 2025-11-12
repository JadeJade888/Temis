import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Vibration,
    Alert,
    Animated,
    Easing,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';


const { width, height } = Dimensions.get('window');

export default function BotonEmergenciaScreen({ navigation }) {
    const [emergencyActive, setEmergencyActive] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [contacts, setContacts] = useState([]); // Contactos cargados de Firestore
    const [location, setLocation] = useState(null); // Ubicación actual
    const [isLoading, setIsLoading] = useState(true);

    // Animaciones
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    // buttonScaleAnim no es necesario si solo se usa pulseAnim para la vibración visual.


    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    useEffect(() => {
        const loadInitialData = async () => {
            // Pedir permisos de ubicación
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso Denegado', 'Necesitamos acceso a su ubicación para enviar la alerta de emergencia.');
                setIsLoading(false);
                return;
            }
            // Obtener la ubicación actual (una sola vez)
            let lastLocation = await Location.getCurrentPositionAsync({});
            setLocation(lastLocation.coords);

            // Cargar contactos de emergencia desde Firestore
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                try {
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        // Asumimos que emergencyContacts es un array de objetos: [{ name: '...', phone: '...' }]
                        setContacts(data.emergencyContacts || []);
                    }
                } catch (error) {
                    console.error("Error al cargar contactos:", error);
                }
            }

            setIsLoading(false);
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        let timer;
        if (emergencyActive && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);

            // Iniciar animaciones de bucle y fade si aún no están corriendo
            if (progressAnim._value === 0) {
                // Animación de la barra de progreso (10s total)
                Animated.timing(progressAnim, {
                    toValue: 1,
                    duration: 10000,
                    easing: Easing.linear,
                    useNativeDriver: false
                }).start();

                // Animación de pulso
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                        Animated.timing(pulseAnim, { toValue: 0.95, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
                    ])
                ).start();

                // Animación de fade-in para el contador
                Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
            }

        } else if (countdown === 0 && emergencyActive) {
            // La cuenta regresiva llegó a cero: ENVIAR ALERTA REAL
            sendEmergencyAlert();
        }

        return () => {
            clearInterval(timer);
            // Detener el loop de animación al desmontar o cancelar
            pulseAnim.stopAnimation();
            progressAnim.stopAnimation();
        };
    }, [emergencyActive, countdown]);

    const startEmergency = () => {
        if (contacts.length === 0) {
            Alert.alert("Atención", "No tiene contactos de emergencia registrados. Regístrelos en su perfil antes de usar el botón.");
            return;
        }
        if (!location) {
            Alert.alert("Atención", "No pudimos obtener su ubicación. Asegúrese de que el GPS esté encendido y conceda permisos.");
            return;
        }

        Vibration.vibrate(100);
        setEmergencyActive(true);
        setCountdown(10);
        progressAnim.setValue(0);
        pulseAnim.setValue(1); // Resetear el valor de pulso
        fadeAnim.setValue(0); // Asegurar que el fade empiece en 0
    };

    const cancelEmergency = () => {
        // Detener animaciones antes de resetear el estado
        pulseAnim.stopAnimation();
        progressAnim.stopAnimation();

        setEmergencyActive(false);
        setCountdown(10);
        progressAnim.setValue(0);

        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
        }).start(() => {
            // Resetear el valor del pulso una vez que el fade termine, si es necesario
            pulseAnim.setValue(1);
        });
    };

    const sendEmergencyAlert = async () => {
        Vibration.vibrate([0, 500, 200, 500]); // Vibración de confirmación

        // Generación correcta de URL con coordenadas
        const mapsLink = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
        const userName = auth.currentUser?.displayName || auth.currentUser?.email || 'un usuario';

        if (contacts.length === 0) {
            Alert.alert("Alerta Enviada", "No se envió a contactos. No hay contactos registrados.");
        } else {
            for (const contact of contacts) {
                // Verificar que el objeto contacto tenga la propiedad 'phone'
                if (!contact.phone) {
                    console.warn(`Contacto ${contact.name || 'sin nombre'} no tiene un número de teléfono válido.`);
                    continue;
                }

                const message = `🚨 ¡ALERTA DE EMERGENCIA de ${userName}! Necesito ayuda inmediata. Mi última ubicación conocida es: ${mapsLink}`;

                // Formato de URL de WhatsApp: Asegurar que el número tenga código de país (ej. +521234567890).
                // Si el número en Firestore NO incluye el código de país, esto fallará.
                const phoneNumber = contact.phone.replace(/[\s\-\(\)]/g, ''); // Limpiar el número

                const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

                try {
                    const supported = await Linking.canOpenURL(url);

                    if (supported) {
                        // Esto abrirá WhatsApp. El usuario debe presionar 'Enviar' por cada contacto.
                        await Linking.openURL(url);
                    } else {
                        console.warn(`No se pudo abrir WhatsApp para ${contact.name}. Verifique la aplicación.`);
                    }
                } catch (error) {
                    console.error(`Error al abrir enlace para ${contact.name}:`, error);
                }
            }

            Alert.alert(
                "Alerta Iniciada",
                "Se ha intentado abrir WhatsApp para enviar mensajes a sus contactos de emergencia. Por favor, asegúrese de enviar cada mensaje manualmente dentro de WhatsApp."
            );
        }

        // Resetear UI al final, independientemente del éxito del envío
        setEmergencyActive(false);
        setCountdown(10);
        progressAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
    };


    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#49688d" />
                    <Text style={styles.loadingText}>Cargando datos y permisos...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Botón de Emergencia</Text>
                        <Text style={styles.subtitle}>
                            Para situaciones de riesgo inminente
                        </Text>
                    </View>

                    <View style={styles.emergencySection}>
                        {emergencyActive ? (
                            <>
                                <View style={styles.emergencyButtonContainer}>
                                    <View style={styles.emergencyButtonWrapper}>
                                        <Animated.View
                                            style={[
                                                styles.emergencyButtonActive,
                                                { transform: [{ scale: pulseAnim }] } // Pulso activo
                                            ]}
                                        >
                                            <Text style={styles.emergencyButtonTextActive}>ALERTA</Text>
                                            <Text style={styles.emergencyButtonSubtextActive}>Activada</Text>
                                        </Animated.View>
                                    </View>

                                    <View style={styles.progressContainer}>
                                        <View style={styles.progressBarContainer}>
                                            <Animated.View

                                                style={[styles.progressBar, { width: progressWidth }]}
                                            />
                                        </View>
                                        <Text style={styles.progressText}>
                                            {countdown}s restantes
                                        </Text>
                                    </View>
                                </View>

                                <Animated.View
                                    style={[styles.countdownContainer, { opacity: fadeAnim }]}
                                >
                                    <View style={styles.countdownHeader}>
                                        <Ionicons name="time-outline" size={24} color="#49688d" />
                                        <Text style={styles.countdownTitle}>Alerta en Progreso</Text>
                                    </View>

                                    <View style={styles.countdownCircle}>
                                        <Text style={styles.countdownNumber}>{countdown}</Text>
                                        <Text style={styles.countdownLabel}>segundos</Text>
                                    </View>

                                    <Text style={styles.countdownText}>
                                        Se notificará a sus contactos de emergencia en:
                                    </Text>

                                    <Text style={styles.countdownSubtext}>
                                        Se enviará su ubicación actual y un mensaje de alerta a través de WhatsApp.
                                    </Text>

                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={cancelEmergency}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#fff" />
                                        <Text style={styles.cancelButtonText}>Cancelar Alerta</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            </>
                        ) : (
                            <View style={styles.emergencyButtonWrapper}>

                                <TouchableOpacity
                                    style={styles.emergencyButton}
                                    onPress={startEmergency}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.emergencyButtonInner}>
                                        <Text style={styles.emergencyButtonText}>EMERGENCIA</Text>
                                        <Text style={styles.emergencyButtonSubtext}>
                                            Mantén presionado 1s o presiona para activar
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.infoSection}>
                        <View style={styles.infoHeader}>
                            <Ionicons name="information-circle" size={24} color="#49688d" />
                            <Text style={styles.infoTitle}>Información Importante</Text>
                        </View>

                        <View style={styles.infoGrid}>
                            <View style={styles.infoCard}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons name="warning" size={20} color="#e74c3c" />
                                </View>
                                <Text style={styles.infoCardTitle}>¿Cuándo usarlo?</Text>
                                <Text style={styles.infoCardText}>
                                    Solo en situaciones de verdadera emergencia donde su seguridad esté en riesgo inminente.
                                </Text>
                            </View>

                            <View style={styles.infoCard}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons name="location" size={20} color="#49688d" />
                                </View>
                                <Text style={styles.infoCardTitle}>¿Qué sucede?</Text>
                                <Text style={styles.infoCardText}>
                                    Se enviará su ubicación actual y alerta a sus contactos de emergencia registrados.
                                </Text>
                            </View>

                            <View style={styles.infoCard}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons name="timer" size={20} color="#27ae60" />
                                </View>
                                <Text style={styles.infoCardTitle}>Tiempo de respuesta</Text>
                                <Text style={styles.infoCardText}>
                                    Tiene 10 segundos para cancelar antes de que se envíe la alerta automáticamente.
                                </Text>
                            </View>

                            <View style={styles.infoCard}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons name="people" size={20} color="#8e44ad" />
                                </View>
                                <Text style={styles.infoCardTitle}>Contactos</Text>
                                <Text style={styles.infoCardText}>
                                    Asegúrese de tener contactos de emergencia actualizados en la aplicación, con el código de país (ej. +52...).
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#7f8c8d',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 10,
        paddingVertical: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        color: '#2c3e50',
        letterSpacing: 0.5,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#7f8c8d',
        fontWeight: '500',
    },
    emergencySection: {
        minHeight: height * 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    emergencyButtonWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    emergencyButton: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#e74c3c',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        borderWidth: 4,
        borderColor: '#ff6b6b',
    },
    emergencyButtonInner: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    emergencyButtonActive: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#ff5252',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        borderWidth: 6,
        borderColor: '#ff7979',
    },
    emergencyButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: 8,
        letterSpacing: 1,
    },
    emergencyButtonSubtext: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        marginTop: 8,
        fontWeight: '500',
        textAlign: 'center',
    },
    emergencyButtonTextActive: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: 8,
        letterSpacing: 1,
    },
    emergencyButtonSubtextActive: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
    emergencyButtonContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },
    progressContainer: {
        alignItems: 'center',
        marginTop: 25,
        width: 250,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#ff5252',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#7f8c8d',
        fontWeight: '600',
    },
    countdownContainer: {
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 25,
        borderRadius: 20,
        width: width * 0.85,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        marginTop: 10,
    },
    countdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    countdownTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
        marginLeft: 8,
    },
    countdownCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#49688d',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    countdownNumber: {
        color: 'white',
        fontSize: 32,
        fontWeight: '900',
        lineHeight: 32,
    },
    countdownLabel: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    countdownText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 8,
        color: '#2c3e50',
        fontWeight: '600',
        lineHeight: 22,
    },
    countdownSubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        color: '#7f8c8d',
        lineHeight: 20,
    },
    cancelButton: {
        backgroundColor: '#2c3e50',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    cancelButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.5,
        marginLeft: 8,
    },
    infoSection: {
        marginTop: 25,
        padding: 0,
        backgroundColor: 'transparent',
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2c3e50',
        marginLeft: 10,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    infoCard: {
        width: (width - 50) / 2 - 5,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    infoIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
        color: '#2c3e50',
        lineHeight: 18,
    },
    infoCardText: {
        fontSize: 12,
        color: '#7f8c8d',
        lineHeight: 16,
    },
});
