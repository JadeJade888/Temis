import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  TextInput, Alert, Image, Modal, FlatList, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';

const REPORT_COLLECTION = 'citizenReports';

const Reportes_Ciudadanos = () => {
  // Estados de Carga y Reportes 
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados del formulario 
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [authoritiesModalVisible, setAuthoritiesModalVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState([]);
  const [newAuthority, setNewAuthority] = useState('');
  const [selectedReportForStatus, setSelectedReportForStatus] = useState(null);
  const [selectedReportForAuthorities, setSelectedReportForAuthorities] = useState(null);

  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [isLocating, setIsLocating] = useState(false);


  const categories = ['Seguridad', 'Infraestructura', 'Medio Ambiente', 'Servicios Públicos', 'Otro'];
  const statusOptions = ['Pendiente', 'En proceso', 'Atendido'];
  const commonAuthorities = [
    'Policía Municipal',
    'Protección Civil',
    'Departamento de Obras Públicas',
    'Comisión de Alumbrado Público',
    'Medio Ambiente',
    'Tránsito Municipal',
    'Bomberos',
    'DIF Municipal'
  ];

  // Lógica de Carga y Firestore
  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Alerta", "Es posible que algunas funciones estén restringidas sin iniciar sesión.");
      // No hace return para que al menos intente cargar los reportes (ahora globales)
      // setLoading(false);
      // return;
    }

    const q = query(
      collection(db, REPORT_COLLECTION),
      orderBy("timestamp", "desc")
    );

    setLoading(true);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Normalizar la lectura de coordenadas (Firestore Geopoint)
        const coordsData = data.coordinates;
        const lat = coordsData?.latitude;
        const lng = coordsData?.longitude;

        reportsList.push({
          id: doc.id,
          ...data,
          // Asegurar que las coordenadas estén en formato simple
          coordinates: (coordsData && typeof lat === 'number' && typeof lng === 'number')
            ? { latitude: lat, longitude: lng }
            : null
        });
      });
      setReports(reportsList);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar reportes:", error);
      Alert.alert("Error de Carga", "No se pudieron obtener los reportes desde la base de datos.");
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const getLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Necesitamos acceso a su ubicación para obtener las coordenadas exactas del reporte.');
        setIsLocating(false);
        return;
      }

      let locationResult = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = locationResult.coords;

      // Obtener la dirección legible (geocodificación inversa)
      let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });

      const street = geocode[0]?.street || 'Ubicación Desconocida';
      const city = geocode[0]?.city || '';
      const region = geocode[0]?.region || '';

      // Guardar las coordenadas exactas
      setCoords({ latitude, longitude });

      // Usar la dirección legible en el campo de texto 
      setLocation(`${street}, ${city}, ${region}`);

      Alert.alert('Ubicación Obtenida', `Coordenadas GPS y dirección estimadas obtenidas. Coords: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

    } catch (error) {
      console.error("Error al obtener ubicación:", error);
      Alert.alert('Error de GPS', 'No pudimos obtener la ubicación. Asegúrate de que el GPS esté encendido.');
      setCoords(null);
      setLocation('');
    } finally {
      setIsLocating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setCategory('');
    setImages([]);
    setEditingReport(null);
    // Resetear Coordenadas
    setCoords(null);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Debe iniciar sesión para enviar un reporte.');
      return;
    }

    if (!title || !description || !location || !category) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const reportData = {
      title,
      description,
      category,
      location,
      coordinates: coords, // {latitude, longitude} o null
      status: 'Pendiente',
      images: images,
      authorities: editingReport ? editingReport.authorities : [],
      userId: user.uid,
      userName: user.displayName || user.email || 'Usuario Anónimo',
      timestamp: new Date(),
    };

    try {
      if (editingReport) {
        const reportDocRef = doc(db, REPORT_COLLECTION, editingReport.id);
        // Actualizar Coordenadas en la edición
        await updateDoc(reportDocRef, {
          title: reportData.title,
          description: reportData.description,
          category: reportData.category,
          location: reportData.location,
          coordinates: reportData.coordinates,
          images: reportData.images,
        });
        Alert.alert('Éxito', 'Reporte actualizado correctamente');
      } else {
        await addDoc(collection(db, REPORT_COLLECTION), reportData);
        Alert.alert('Éxito', 'Reporte enviado correctamente');
      }
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error("Error al guardar/actualizar reporte:", error);
      Alert.alert('Error de Guardado', 'Hubo un error al guardar el reporte. Intenta de nuevo.');
    }
  };



  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const reportDocRef = doc(db, REPORT_COLLECTION, reportId);
      await updateDoc(reportDocRef, { status: newStatus });
      setStatusModalVisible(false);
      Alert.alert('Éxito', `Estado actualizado a: ${newStatus}`);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      Alert.alert('Error', 'No se pudo actualizar el estado.');
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este reporte?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const reportDocRef = doc(db, REPORT_COLLECTION, id);
              await deleteDoc(reportDocRef);
              Alert.alert('Éxito', 'Reporte eliminado correctamente');
            } catch (error) {
              console.error("Error al eliminar reporte:", error);
              Alert.alert('Error', 'No se pudo eliminar el reporte.');
            }
          }
        }
      ]
    );
  };

  const addAuthority = async (reportId, authority) => {
    if (!authority.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de la autoridad');
      return;
    }

    try {
      const reportDocRef = doc(db, REPORT_COLLECTION, reportId);
      const docSnap = await getDoc(reportDocRef);
      if (docSnap.exists()) {
        const currentAuthorities = docSnap.data().authorities || [];
        const newAuthorities = [...currentAuthorities, authority.trim()];

        await updateDoc(reportDocRef, { authorities: newAuthorities });
        setNewAuthority('');
        Alert.alert('Éxito', 'Autoridad agregada correctamente');
      }
    } catch (error) {
      console.error("Error al agregar autoridad:", error);
      Alert.alert('Error', 'No se pudo agregar la autoridad.');
    }
  };

  const removeAuthority = async (reportId, authorityIndex) => {
    try {
      const reportDocRef = doc(db, REPORT_COLLECTION, reportId);
      const docSnap = await getDoc(reportDocRef);
      if (docSnap.exists()) {
        const currentAuthorities = docSnap.data().authorities || [];
        const newAuthorities = currentAuthorities.filter((_, index) => index !== authorityIndex);

        await updateDoc(reportDocRef, { authorities: newAuthorities });
      }
      Alert.alert('Éxito', 'Autoridad eliminada');
    } catch (error) {
      console.error("Error al eliminar autoridad:", error);
      Alert.alert('Error', 'No se pudo eliminar la autoridad.');
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setTitle(report.title);
    setDescription(report.description);
    setLocation(report.location);
    setCategory(report.category);
    setImages(report.images || []);
    // Cargar coordenadas existentes al editar
    setCoords(report.coordinates || null);
    setModalVisible(true);
  };


  // Lógica de imágenes 
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para agregar imágenes.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      if (images.length < 5) {
        setImages([...images, result.assets[0].uri]);
      } else {
        Alert.alert('Límite alcanzado', 'Solo puedes agregar hasta 5 imágenes por reporte.');
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar fotos.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      if (images.length < 5) {
        setImages([...images, result.assets[0].uri]);
      } else {
        Alert.alert('Límite alcanzado', 'Solo puedes agregar hasta 5 imágenes por reporte.');
      }
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const renderReportItem = ({ item }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportTitleContainer}>
          <Text style={styles.reportTitle}>{item.title}</Text>
          {/* Botón para cambiar estado */}
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
            onPress={() => {
              setSelectedReportForStatus(item);
              setStatusModalVisible(true);
            }}
          >
            <Text style={styles.statusText}>{item.status}</Text>
            <Ionicons name="chevron-down" size={12} color="white" style={styles.statusArrow} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.reportMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="pricetag" size={14} color="#49688d" />
          <Text style={styles.reportCategory}>{item.category}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location" size={14} color="#e74c3c" />
          <Text style={styles.reportLocation} numberOfLines={1}>{item.location}</Text>
        </View>
        {/* Mostrar icono de GPS si hay coordenadas */}
        {item.coordinates && (
          <View style={styles.metaItem}>
            <Ionicons name="compass" size={14} color="#27ae60" />
            <Text style={styles.reportDate}>GPS: {item.coordinates.latitude.toFixed(4)}, {item.coordinates.longitude.toFixed(4)}</Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <Ionicons name="calendar" size={14} color="#7f8c8d" />
          <Text style={styles.reportDate}>{item.timestamp ? item.timestamp.toDate().toLocaleDateString('es-ES') : 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.reportActions}>
        {/* Botón Ver */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedReport(item);
            setViewModalVisible(true);
          }}
        >
          <View style={[styles.actionIcon, styles.viewIcon]}>
            <Ionicons name="eye" size={16} color="white" />
          </View>
          <Text style={styles.actionText}>Ver</Text>
        </TouchableOpacity>

        {/* Botón Editar */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEdit(item)}
        >
          <View style={[styles.actionIcon, styles.editIcon]}>
            <Ionicons name="pencil" size={16} color="white" />
          </View>
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>

        {/* Botón Autoridades */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedReportForAuthorities(item);
            setAuthoritiesModalVisible(true);
          }}
        >
          <View style={[styles.actionIcon, styles.authorityIcon]}>
            <Ionicons name="shield" size={16} color="white" />
          </View>
          <Text style={styles.actionText}>Autoridades</Text>
        </TouchableOpacity>

        {/* Botón Eliminar */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item.id)}
        >
          <View style={[styles.actionIcon, styles.deleteIcon]}>
            <Ionicons name="trash" size={16} color="white" />
          </View>
          <Text style={styles.actionText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendiente': return '#f39c12';
      case 'En proceso': return '#3498db';
      case 'Atendido': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reportes Ciudadanos</Text>
          <Text style={styles.subtitle}>
            Reporta incidentes en tu comunidad y ayuda a mejorar tu ciudad
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => { resetForm(); setModalVisible(true); }}
          activeOpacity={0.8}
        >
          <View style={styles.addButtonIcon}>
            <Ionicons name="add" size={24} color="white" />
          </View>
          <Text style={styles.addButtonText}>Crear Nuevo Reporte</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#49688d" />
            <Text style={styles.loadingText}>Cargando reportes...</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <MaterialIcons name="report-problem" size={60} color="#95a5a6" />
            </View>
            <Text style={styles.emptyStateText}>No hay reportes aún</Text>
            <Text style={styles.emptyStateSubtext}>
              Crea tu primer reporte para ayudar a mejorar tu comunidad
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={24} color="#2c3e50" />
              <Text style={styles.sectionTitle}>Lista de Reportes</Text>
              <View style={styles.reportCount}>
                <Text style={styles.reportCountText}>{reports.length}</Text>
              </View>
            </View>
            <FlatList
              data={reports}
              renderItem={renderReportItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            resetForm();
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="document-text" size={24} color="#49688d" />
                    <Text style={styles.modalTitle}>
                      {editingReport ? 'Editar Reporte' : 'Nuevo Reporte'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                  >
                    <Ionicons name="close" size={24} color="#7f8c8d" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Título del Reporte *</Text>
                <View style={styles.inputGroup}>
                  <Ionicons name="text" size={20} color="#7f8c8d" style={styles.inputGroupIcon} />
                  <TextInput
                    style={styles.inputField}
                    placeholder="Ej: Bache en avenida principal"
                    placeholderTextColor="#95a5a6"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                <Text style={styles.inputLabel}>Categoría *</Text>
                <View style={styles.categoryContainer}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        category === cat && styles.categoryButtonSelected
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[
                        styles.categoryText,
                        category === cat && styles.categoryTextSelected
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Ubicación (GPS y Dirección) *</Text>
                <View style={styles.inputGroupContainer}>
                  {/* Botón de Geolocalización */}
                  <TouchableOpacity
                    style={[styles.locationButton, isLocating && styles.locationButtonDisabled]}
                    onPress={getLocation}
                    disabled={isLocating}
                  >
                    {isLocating ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Ionicons name="locate" size={20} color="white" />
                    )}
                    <Text style={styles.locationButtonText}>
                      {isLocating
                        ? 'Obteniendo GPS...'
                        : coords
                          ? 'GPS Obtenido'
                          : 'Obtener Ubicación GPS'}
                    </Text>
                  </TouchableOpacity>

                  {/* Campo de texto de ubicación */}
                  <View style={styles.inputGroup}>
                    <Ionicons name="location" size={20} color="#7f8c8d" style={styles.inputGroupIcon} />
                    <TextInput
                      style={[styles.inputField, { paddingLeft: 10 }]}
                      placeholder={coords ? "Verifique la dirección (Opcional)" : "Escriba la dirección o use GPS"}
                      placeholderTextColor="#95a5a6"
                      value={location}
                      onChangeText={setLocation}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Descripción *</Text>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={[styles.inputField, styles.textArea]}
                    placeholder="Describe el incidente en detalle..."
                    placeholderTextColor="#95a5a6"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <Text style={styles.inputLabel}>Agregar Imágenes ({images.length}/5)</Text>
                <View style={styles.imageButtonsContainer}>
                  <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                    <Ionicons name="camera" size={20} color="#49688d" />
                    <Text style={styles.imageButtonText}>Tomar Foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    <Ionicons name="image" size={20} color="#49688d" />
                    <Text style={styles.imageButtonText}>Galería</Text>
                  </TouchableOpacity>
                </View>

                {images.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                    {images.map((image, index) => (
                      <View key={index} style={styles.imagePreviewContainer}>
                        <Image source={{ uri: image }} style={styles.imagePreview} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Ionicons name="close-circle" size={20} color="#e74c3c" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                >
                  <Ionicons name="send" size={20} color="white" />
                  <Text style={styles.submitButtonText}>
                    {editingReport ? 'Actualizar Reporte' : 'Enviar Reporte'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={viewModalVisible}
          onRequestClose={() => setViewModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.viewModalContent]}>
              <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.viewModalScrollContent}
              >
                {selectedReport && (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalTitleContainer}>
                        <Ionicons name="document" size={24} color="#49688d" />
                        <Text style={styles.modalTitle}>Detalles del Reporte</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setViewModalVisible(false)}
                      >
                        <Ionicons name="close" size={24} color="#7f8c8d" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.viewTitle}>{selectedReport.title}</Text>

                    <View style={styles.detailSection}>
                      {/* Fila de Categoría */}
                      <View style={styles.detailRow}>
                        <View style={styles.detailLabelContainer}>
                          <Ionicons name="pricetag" size={16} color="#49688d" />
                          <Text style={styles.detailLabel}>Categoría</Text>
                        </View>
                        <Text style={styles.detailValue}>{selectedReport.category}</Text>
                      </View>

                      {/* Fila de Ubicación (Dirección) */}
                      <View style={styles.detailRow}>
                        <View style={styles.detailLabelContainer}>
                          <Ionicons name="location" size={16} color="#e74c3c" />
                          <Text style={styles.detailLabel}>Dirección</Text>
                        </View>
                        <Text style={styles.detailValue}>{selectedReport.location}</Text>
                      </View>

                      {/*Mostrar Coordenadas si existen */}
                      {selectedReport.coordinates && (
                        <View style={styles.detailRow}>
                          <View style={styles.detailLabelContainer}>
                            <Ionicons name="map" size={16} color="#27ae60" />
                            <Text style={styles.detailLabel}>Coordenadas</Text>
                          </View>
                          <Text style={styles.detailValue}>
                            {selectedReport.coordinates.latitude.toFixed(4)}, {selectedReport.coordinates.longitude.toFixed(4)}
                          </Text>
                        </View>
                      )}

                      {/* Fila de Fecha */}
                      <View style={styles.detailRow}>
                        <View style={styles.detailLabelContainer}>
                          <Ionicons name="calendar" size={16} color="#7f8c8d" />
                          <Text style={styles.detailLabel}>Fecha</Text>
                        </View>
                        <Text style={styles.detailValue}>
                          {selectedReport.timestamp ? selectedReport.timestamp.toDate().toLocaleDateString('es-ES') : 'N/A'}
                        </Text>
                      </View>

                      {/* Fila de Estado */}
                      <View style={styles.detailRow}>
                        <View style={styles.detailLabelContainer}>
                          <Ionicons name="time" size={16} color="#f39c12" />
                          <Text style={styles.detailLabel}>Estado</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedReport.status) }]}>
                          <Text style={styles.statusText}>{selectedReport.status}</Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.detailLabel}>Descripción:</Text>
                    <View style={styles.descriptionBox}>
                      <Text style={styles.viewDescription}>{selectedReport.description}</Text>
                    </View>

                    {selectedReport.images && selectedReport.images.length > 0 && (
                      <>
                        <Text style={styles.detailLabel}>Imágenes Adjuntas:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                          {selectedReport.images.map((image, index) => (
                            <Image key={index} source={{ uri: image }} style={styles.viewImage} />
                          ))}
                        </ScrollView>
                      </>
                    )}

                    {selectedReport.authorities && selectedReport.authorities.length > 0 && (
                      <>
                        <Text style={styles.detailLabel}>Autoridades Notificadas:</Text>
                        <View style={styles.authoritiesContainer}>
                          {selectedReport.authorities.map((authority, index) => (
                            <View key={index} style={styles.authorityItem}>
                              <Ionicons name="shield-checkmark" size={16} color="#27ae60" />
                              <Text style={styles.authorityText}>{authority}</Text>
                            </View>
                          ))}
                        </View>
                      </>
                    )}

                    <TouchableOpacity
                      style={styles.closeViewButton}
                      onPress={() => setViewModalVisible(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.closeViewButtonText}>Cerrar</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={statusModalVisible}
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.smallModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cambiar Estado</Text>
                <TouchableOpacity
                  onPress={() => setStatusModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#7f8c8d" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>Selecciona el nuevo estado:</Text>

              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.statusOption}
                  onPress={() => updateReportStatus(selectedReportForStatus.id, status)}
                >
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                  <Text style={styles.statusOptionText}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={authoritiesModalVisible}
          onRequestClose={() => setAuthoritiesModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="shield" size={24} color="#49688d" />
                    <Text style={styles.modalTitle}>Autoridades Notificadas</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setAuthoritiesModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#7f8c8d" />
                  </TouchableOpacity>
                </View>

                {selectedReportForAuthorities && (
                  <>
                    <Text style={styles.inputLabel}>Agregar Nueva Autoridad</Text>
                    <View style={styles.addAuthorityContainer}>
                      <TextInput
                        style={styles.authorityInput}
                        placeholder="Nombre de la autoridad..."
                        placeholderTextColor="#95a5a6"
                        value={newAuthority}
                        onChangeText={setNewAuthority}
                      />
                      <TouchableOpacity
                        style={styles.addAuthorityButton}
                        onPress={() => addAuthority(selectedReportForAuthorities.id, newAuthority)}
                      >
                        <Ionicons name="add" size={20} color="white" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Autoridades Comunes:</Text>
                    <View style={styles.commonAuthoritiesContainer}>
                      {commonAuthorities.map((authority) => (
                        <TouchableOpacity
                          key={authority}
                          style={styles.commonAuthorityButton}
                          onPress={() => addAuthority(selectedReportForAuthorities.id, authority)}
                        >
                          <Text style={styles.commonAuthorityText}>{authority}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.inputLabel}>Autoridades Notificadas:</Text>
                    {selectedReportForAuthorities.authorities && selectedReportForAuthorities.authorities.length > 0 ? (
                      <View style={styles.authoritiesList}>
                        {selectedReportForAuthorities.authorities.map((authority, index) => (
                          <View key={index} style={styles.authorityListItem}>
                            <Ionicons name="business" size={16} color="#49688d" />
                            <Text style={styles.authorityListItemText}>{authority}</Text>
                            <TouchableOpacity
                              style={styles.removeAuthorityButton}
                              onPress={() => removeAuthority(selectedReportForAuthorities.id, index)}
                            >
                              <Ionicons name="close" size={16} color="#e74c3c" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noAuthoritiesText}>No se han agregado autoridades</Text>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#49688d',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    elevation: 6, 
    shadowColor: '#49688d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addButtonIcon: {
    marginRight: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7f8c8d',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 12,
    flex: 1,
  },
  reportCount: {
    backgroundColor: '#49688d',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 5, 
    borderLeftColor: '#49688d',
  },
  reportHeader: {
    marginBottom: 12,
  },
  reportTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
    lineHeight: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 100,
    justifyContent: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  statusArrow: {
    marginLeft: 4,
  },
  reportMeta: {
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
    paddingTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportCategory: {
    fontSize: 14,
    color: '#49688d',
    fontWeight: '600',
    marginLeft: 6,
  },
  reportLocation: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    marginLeft: 6,
  },
  reportDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 6,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    marginHorizontal: -10,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 5,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  viewIcon: {
    backgroundColor: '#49688d', 
  },
  editIcon: {
    backgroundColor: '#f39c12',
  },
  authorityIcon: {
    backgroundColor: '#9b59b6',
  },
  deleteIcon: {
    backgroundColor: '#e74c3c',
  },
  actionText: {
    fontSize: 11, 
    color: '#7f8c8d',
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '90%',
    elevation: 10,
  },
  viewModalContent: {
    maxHeight: '95%',
  },
  viewModalScrollContent: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22, 
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 16,
  },
  inputGroupContainer: {
    marginBottom: 10,
    gap: 10,
  },
  inputGroup: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  inputGroupIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2c3e50',
    paddingLeft: 45, 
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
    paddingLeft: 15, 
  },
  locationButton: {
    flexDirection: 'row',
    backgroundColor: '#49688d',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  locationButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryButtonSelected: {
    backgroundColor: '#49688d',
    borderColor: '#49688d',
  },
  categoryText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f0fe',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c3dafe',
  },
  imageButtonText: {
    fontSize: 14,
    color: '#49688d',
    fontWeight: '600',
    marginLeft: 6,
  },
  imagesContainer: {
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  viewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#27ae60', 
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 3,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  viewTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 20,
    lineHeight: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    paddingLeft: 10,
  },
  detailSection: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 15,
    color: '#5d6d7e',
    fontWeight: '500',
  },
  descriptionBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  viewDescription: {
    fontSize: 16,
    color: '#5d6d7e',
    lineHeight: 24,
  },
  closeViewButton: {
    backgroundColor: '#49688d', 
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeViewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  smallModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignSelf: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  addAuthorityContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  authorityInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginRight: 10,
    color: '#2c3e50',
  },
  addAuthorityButton: {
    backgroundColor: '#49688d',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commonAuthoritiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  commonAuthorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#49688d',
  },
  commonAuthorityText: {
    fontSize: 12,
    color: '#49688d',
    fontWeight: '500',
  },
  authoritiesList: {
    marginBottom: 20,
  },
  authorityListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  authorityListItemText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
    fontWeight: '500',
  },
  removeAuthorityButton: {
    padding: 4,
  },
  noAuthoritiesText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  authoritiesContainer: {
    marginBottom: 20,
  },
  authorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#49688d',
  },
  authorityText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default Reportes_Ciudadanos;
