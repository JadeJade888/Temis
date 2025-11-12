import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
    Image,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';


const Perfil = () => {

    // Definir el estado de carga
    const [loading, setLoading] = useState(true);

    const [userData, setUserData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        fechaNacimiento: '',
        genero: '',
        tipoSangre: '',
        alergias: '',
        // Mantenemos como arreglo para mapear la data de Firestore
        emergencyContacts: []
    });

    const [isEditing, setIsEditing] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [locationSharing, setLocationSharing] = useState(true);

    const handleSave = async () => {
        setIsEditing(false);
        setLoading(true); // Muestra el indicador de carga

        const user = auth.currentUser;
        if (!user) {
            Alert.alert("Error de autenticación", "Usuario no autenticado. Por favor, reinicia la sesión.");
            setLoading(false);
            return;
        }

        // mapeo de estado a nombres de campos de Firestore consistentes
        const dataToUpdate = {
            name: userData.nombre,
            phone: userData.telefono,
            address: userData.direccion,
            dateOfBirth: userData.fechaNacimiento,
            gender: userData.genero,
            bloodType: userData.tipoSangre,
            allergies: userData.alergias,

            // Preferencias (Se guardan los valores de los Switches)
            notificationsEnabled: notifications,
            locationSharingEnabled: locationSharing,

            profileCompleted: true,
        };

        console.log("DEBUG: Datos a enviar (Corregidos):", dataToUpdate);

        try {
            const userDocRef = doc(db, 'users', user.uid);

            //  Usar setDoc con merge: true para crear/actualizar el documento
            await setDoc(userDocRef, dataToUpdate, { merge: true });

            Alert.alert('Éxito', 'Perfil actualizado correctamente.');
        } catch (error) {
            console.error("Error al guardar perfil:", error);
            Alert.alert('Error', 'No se pudieron guardar los cambios. Intenta nuevamente. Revisa la consola para detalles.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (!user) {
                setLoading(false);
                return;
            }

            const userDocRef = doc(db, 'users', user.uid);

            try {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();

                    //  Mapeo de DB (data) a estado local (userData)
                    setUserData({
                        email: user.email,
                        nombre: data.name || '',
                        telefono: data.phone || data.telefono || '',
                        direccion: data.address || data.direccion || '',
                        fechaNacimiento: data.dateOfBirth || data.fechaNacimiento || '',
                        genero: data.gender || data.genero || '',
                        tipoSangre: data.bloodType || data.tipoSangre || '',
                        alergias: data.allergies || '',
                        //  Mapear el array de contactos o un array vacío
                        emergencyContacts: data.emergencyContacts || [],
                    });

                    // Cargar preferencias
                    setNotifications(data.notificationsEnabled === undefined ? true : data.notificationsEnabled);
                    setLocationSharing(data.locationSharingEnabled === undefined ? true : data.locationSharingEnabled);

                } else {
                    // Documento no existe: solo cargamos el email de Auth
                    setUserData(prev => ({ ...prev, email: user.email }));
                }
            } catch (error) {
                console.error("Error al cargar datos del perfil:", error);
                Alert.alert("Error", "No se pudieron cargar los datos.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleInputChange = (field, value) => {
        setUserData(prev => ({
            ...prev,
            [field]: value
        }));
    };


    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#49688d" />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
            </SafeAreaView>
        );
    }

    const renderEditableField = (label, value, field, keyboardType = 'default') => (
        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {isEditing ? (
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={(text) => handleInputChange(field, text)}
                    keyboardType={keyboardType}
                    editable={field !== 'email'} // El email no debe ser editable aquí
                />
            ) : (
                <Text style={styles.fieldValue}>{value || 'No especificado'}</Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Header con foto de perfil */}
                <View style={styles.header}>
                    <View style={styles.profileImageContainer}>
                        <View style={styles.profilePlaceholder}>
                            <Ionicons name="person" size={50} color="#fff" />
                        </View>
                    </View>

                    <Text style={styles.userName}>{userData.nombre || 'Usuario TEMIS'}</Text>
                    <Text style={styles.userEmail}>{userData.email}</Text>
                </View>

                {/* Botones de acción */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, isEditing ? styles.saveButton : styles.editButton]}
                        onPress={isEditing ? handleSave : () => setIsEditing(true)}
                    >
                        <Ionicons
                            name={isEditing ? "checkmark" : "pencil"}
                            size={20}
                            color="#fff"
                        />
                        <Text style={styles.actionButtonText}>
                            {isEditing ? 'Guardar' : 'Editar Perfil'}
                        </Text>
                    </TouchableOpacity>

                    {isEditing && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => { setIsEditing(false); fetchUserData(); }} // Recarga para descartar cambios
                        >
                            <Ionicons name="close" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Información personal */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="person-outline" size={24} color="#4285F4" />
                        <Text style={styles.sectionTitle}>Información Personal</Text>
                    </View>

                    {renderEditableField('Nombre completo', userData.nombre, 'nombre')}
                    {renderEditableField('Email', userData.email, 'email', 'email-address')}
                    {renderEditableField('Teléfono', userData.telefono, 'telefono', 'phone-pad')}
                    {renderEditableField('Fecha de nacimiento', userData.fechaNacimiento, 'fechaNacimiento')}
                    {renderEditableField('Género', userData.genero, 'genero')}
                </View>

                {/* Información de contacto */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="location-outline" size={24} color="#49688d" />
                        <Text style={styles.sectionTitle}>Dirección</Text>
                    </View>

                    {renderEditableField('Dirección', userData.direccion, 'direccion')}
                </View>

                {/* Información médica */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="medical-bag" size={24} color="#49688d" />
                        <Text style={styles.sectionTitle}>Información Médica</Text>
                    </View>

                    {renderEditableField('Tipo de sangre', userData.tipoSangre, 'tipoSangre')}
                    {renderEditableField('Alergias', userData.alergias, 'alergias')}
                </View>

                {/* Contacto de emergencia (Muestra el primer contacto si existe) */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="alert-circle-outline" size={24} color="#49688d" />
                        <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
                    </View>

                    {userData.emergencyContacts && userData.emergencyContacts.length > 0 ? (
                        <View style={styles.contactDisplay}>
                            <Text style={styles.contactName}>
                                {userData.emergencyContacts[0].name}
                            </Text>
                            <Text style={styles.contactPhone}>
                                {userData.emergencyContacts[0].phone}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.fieldValue}>
                            No hay contactos de emergencia registrados.
                        </Text>
                    )}



                </View>

                {/* Preferencias */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="settings-outline" size={24} color="#49688d" />
                        <Text style={styles.sectionTitle}>Preferencias</Text>
                    </View>

                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Ionicons name="notifications-outline" size={20} color="#6c757d" />
                            <Text style={styles.preferenceText}>Notificaciones de emergencia</Text>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            thumbColor={notifications ? '#4285F4' : '#f4f3f4'}
                            trackColor={{ false: '#767577', true: '#81b0ff' }}
                            disabled={!isEditing} // Deshabilita si no está editando
                        />
                    </View>

                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Ionicons name="location-outline" size={20} color="#6c757d" />
                            <Text style={styles.preferenceText}>Compartir ubicación en emergencias</Text>
                        </View>
                        <Switch
                            value={locationSharing}
                            onValueChange={setLocationSharing}
                            thumbColor={locationSharing ? '#4285F4' : '#f4f3f4'}
                            trackColor={{ false: '#767577', true: '#81b0ff' }}
                            disabled={!isEditing} // Deshabilita si no está editando
                        />
                    </View>
                </View>



            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        color: '#49688d',
        fontSize: 16,
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 25,
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    profilePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#49688d',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#49688d',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
        gap: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 25,
        gap: 8,
    },
    editButton: {
        backgroundColor: '#49688d', 
    },
    saveButton: {
        backgroundColor: '#27AE60', 
    },
    cancelButton: {
        backgroundColor: '#95A5A6', 
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
    },
    fieldContainer: {
        marginBottom: 15,
    },
    fieldLabel: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 5,
        fontWeight: '500',
    },
    fieldValue: {
        fontSize: 16,
        color: '#2c3e50',
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    input: {
        fontSize: 16,
        color: '#2c3e50',
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    preferenceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    preferenceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    preferenceText: {
        fontSize: 16,
        color: '#2c3e50',
        flex: 1,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#49688d',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
    },
    linkButton: {
        marginTop: 10,
        paddingVertical: 5,
    },
    linkText: {
        color: '#49688d',
        fontWeight: '600',
    },

    contactDisplay: {
        padding: 12,
        backgroundColor: '#ecf0f1',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#49688d',
        marginBottom: 10,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 2,
    },
    contactPhone: {
        fontSize: 14,
        color: '#7f8c8d',
    },
});

export default Perfil;
