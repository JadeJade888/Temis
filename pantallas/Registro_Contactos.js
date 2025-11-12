import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    FlatList,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const saveContactsToFirebase = async (updatedContacts, userUid) => {
    if (!userUid) return false;

    const userDocRef = doc(db, 'users', userUid);

    try {

        await updateDoc(userDocRef, {
            emergencyContacts: updatedContacts
        });
        return true;
    } catch (error) {

        console.error("Error al guardar contactos en Firebase:", error);
        Alert.alert("Error de Guardado", "No se pudieron guardar los cambios. Revisa las reglas de seguridad.");
        return false;
    }
};

const Registro_Contactos = () => {
    const [contacts, setContacts] = useState([]);
    const [newContact, setNewContact] = useState({ name: '', phone: '' });
    const [loading, setLoading] = useState(true);
    const [userUid, setUserUid] = useState(null); // Almacena el UID aquí

    useEffect(() => {
        const fetchContacts = async () => {
            const user = auth.currentUser;
            if (!user) {
                setLoading(false);
                Alert.alert("Error", "Debes iniciar sesión para ver tus contactos.");
                return;
            }

            setUserUid(user.uid); // Guarda el UID
            const userDocRef = doc(db, 'users', user.uid);

            try {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();

                    setContacts(data.emergencyContacts || []);
                }
            } catch (error) {
                console.error("Error al cargar contactos: ", error);
                Alert.alert("Error", "No se pudieron cargar los contactos.");
            } finally {
                setLoading(false);
            }
        };
        fetchContacts();
    }, []);

    const addContact = async () => {
        if (!newContact.name.trim() || !newContact.phone.trim()) {
            Alert.alert('Error', 'Por favor, complete todos los campos');
            return;
        }

        // Crea el nuevo objeto de contacto con un ID
        const newContactItem = {
            id: Date.now().toString(),
            name: newContact.name,
            phone: newContact.phone
        };

        // Sintaxis de array 
        const updatedContacts = [...contacts, newContactItem];

        setLoading(true); // Muestra loading mientras guarda

        // 3. Llama a la función de guardado
        const success = await saveContactsToFirebase(updatedContacts, userUid);

        if (success) {
            setNewContact({ name: '', phone: '' }); // Limpia formulario
            setContacts(updatedContacts); // Actualiza estado local si fue exitoso
            Alert.alert('Éxito', 'Contacto agregado correctamente');
        }
        setLoading(false);
    };

    const deleteContact = (id) => {
        Alert.alert(
            'Eliminar contacto',
            '¿Estás seguro de que quieres eliminar este contacto?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    //  La función onPress debe ser asíncrona
                    onPress: async () => {
                        setLoading(true);
                        // Crea el array filtrado
                        const updatedContacts = contacts.filter(contact => contact.id !== id);

                        // Llama al guardado en Firebase
                        const success = await saveContactsToFirebase(updatedContacts, userUid);

                        if (success) {
                            setContacts(updatedContacts); // Actualiza estado local
                        }
                        setLoading(false);
                    }
                }
            ]
        );
    };

    const renderContactItem = ({ item }) => (

        <View style={styles.contactItem}>
            <View style={styles.contactAvatar}>
                <Ionicons name="person" size={20} color="#49688d" />
            </View>
            <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactPhone}>{item.phone}</Text>
            </View>
            <TouchableOpacity
                onPress={() => deleteContact(item.id)}
                style={styles.deleteButton}
                activeOpacity={0.7}
                disabled={loading}
            >
                <Ionicons name="trash-outline" size={18} color="#e74c3c" />
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#49688d" />
                <Text style={{ marginTop: 10, color: '#7f8c8d' }}>Cargando y sincronizando contactos...</Text>
            </SafeAreaView>
        );
    }

    return (

        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>Contactos de Emergencia</Text>
                        </View>
                        <Text style={styles.subtitle}>
                            Personas que serán notificadas en caso de emergencia
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.formHeader}>
                            <Ionicons name="person-add" size={24} color="#49688d" />
                            <Text style={styles.formTitle}>Agregar Nuevo Contacto</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre completo"
                                placeholderTextColor="#a0a0a0"
                                value={newContact.name}
                                onChangeText={(text) => setNewContact({ ...newContact, name: text })}
                                editable={!loading}
                            />
                        </View>

                        {/* Input Teléfono */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Número de teléfono"
                                placeholderTextColor="#a0a0a0"
                                value={newContact.phone}
                                onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
                                keyboardType="phone-pad"
                                editable={!loading}
                            />
                        </View>

                        {/* Botones de Acción (Guardar/Cancelar) */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setNewContact({ name: '', phone: '' })}
                                activeOpacity={0.8}
                                disabled={loading}
                            >
                                <Ionicons name="close" size={18} color="#7f8c8d" />
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.addButton]}
                                onPress={addContact}
                                activeOpacity={0.8}
                                disabled={loading}
                            >
                                <Ionicons name="checkmark" size={18} color="white" />
                                <Text style={styles.addButtonText}>Agregar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.contactsContainer}>
                        <View style={styles.contactsHeader}>
                            <Ionicons name="people" size={24} color="#49688d" />
                            <Text style={styles.contactsTitle}>Contactos Registrados</Text>
                            <View style={styles.contactsCount}>
                                <Text style={styles.contactsCountText}>{contacts.length}</Text>
                            </View>
                        </View>

                        {contacts.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyStateIcon}>
                                    <Ionicons name="people-outline" size={48} color="#d1d5db" />
                                </View>
                                <Text style={styles.emptyStateText}>No hay contactos registrados</Text>
                                <Text style={styles.emptyStateSubtext}>
                                    Agrega contactos de emergencia para que puedan ayudarte en caso necesario
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={contacts}
                                renderItem={renderContactItem}
                                keyExtractor={item => item.id}
                                scrollEnabled={false}
                                style={styles.contactsList}
                            />
                        )}
                    </View>

                    <View style={styles.infoContainer}>
                        <View style={styles.infoHeader}>
                            <Ionicons name="information-circle" size={20} color="#49688d" />
                            <Text style={styles.infoTitle}>Información Importante</Text>
                        </View>
                        <View style={styles.infoContent}>
                            <View style={styles.infoItem}>
                                <View style={[styles.infoIcon, styles.infoIconPrimary]}>
                                    <Ionicons name="notifications" size={14} color="white" />
                                </View>
                                <Text style={styles.infoText}>
                                    Estos contactos serán notificados automáticamente en caso de emergencia
                                </Text>
                            </View>
                            <View style={styles.infoItem}>
                                <View style={[styles.infoIcon, styles.infoIconSuccess]}>
                                    <Ionicons name="shield-checkmark" size={14} color="white" />
                                </View>
                                <Text style={styles.infoText}>
                                    La información de contactos es privada y segura
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );




};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 10,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2c3e50',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 22,
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
        marginLeft: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    inputIcon: {
        padding: 15,
        paddingRight: 0,
    },
    input: {
        flex: 1,
        padding: 15,
        fontSize: 16,
        color: '#2c3e50',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginHorizontal: 6,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cancelButton: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    cancelButtonText: {
        color: '#7f8c8d',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 6,
    },
    addButton: {
        backgroundColor: '#49688d',
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 6,
    },
    contactsContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    contactsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    contactsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
        marginLeft: 12,
        flex: 1,
    },
    contactsCount: {
        backgroundColor: '#49688d',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactsCountText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    contactsList: {
        marginBottom: 10,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#49688d',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    contactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e3eaf3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 4,
    },
    contactPhone: {
        fontSize: 14,
        color: '#7f8c8d',
        fontWeight: '500',
    },
    deleteButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyStateIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: '600',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#a0a0a0',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '400',
    },
    infoContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2c3e50',
        marginLeft: 12,
    },
    infoContent: {
        marginLeft: 4,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    infoIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    infoIconPrimary: {
        backgroundColor: '#49688d',
    },
    infoIconSuccess: {
        backgroundColor: '#27ae60',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#5d6d7e',
        lineHeight: 20,
        fontWeight: '400',
    },
});

export default Registro_Contactos;
