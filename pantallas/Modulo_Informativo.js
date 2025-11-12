import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Linking, Alert, SectionList
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const Modulo_Informativo = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Datos de contacto de emergencia extraídos del documento
  const emergencyData = [
    {
      title: 'POLICÍAS',
      data: [
        { name: 'Robo de Vehículos', number: '066' },
        { name: 'Policía Municipal de Tonalá', number: '35-86-61-00' },
        { name: 'Policía Municipal de Zapopan', number: '36-56-56-56' },
        { name: 'Policía Municipal de Tlaquepaque', number: '30-50-30-50' },
        { name: 'Policía Municipal de Guadalajara', number: '36-19-39-75 / 060' },
        { name: 'Secretaría de Seguridad Ciudadana', number: '38-14-15-15' },
        { name: 'Seguridad Para el Turista', number: '01-800-36-32-200' },
        { name: 'Radio Patrullas', number: '080' },
        { name: 'Procuraduría General de Justicia', number: '38-37-60-00' },
        { name: 'Policía Preventiva', number: '36-73-38-31' },
      ]
    },
    {
      title: 'BOMBEROS Y PROTECCIÓN CIVIL',
      data: [
        { name: 'Emergencias', number: '36-19-52-41' },
        { name: 'Base 1', number: '36-19-07-94' },
        { name: 'Base 2', number: '38-23-35-61' },
        { name: 'Base 3', number: '36-45-60-34' },
        { name: 'Base 4', number: '36-44-44-79' },
        { name: 'Base 5', number: '39-42-02-01' },
        { name: 'Protección Civil y Bomberos Tonalá', number: '12-00-39-18 / 12-00-39-30 / 12-00-39-31' },
        { name: 'Protección Civil Jalisco (Estatal)', number: '36-75-30-60' },
      ]
    },
    {
      title: 'OTROS SERVICIOS',
      data: [
        { name: 'Agencia de Delitos Sexuales', number: '38-37-60-00' },
        { name: 'Alcohólicos Anónimos (24 horas)', number: '36-13-89-93 / 36-14-86-79' },
        { name: 'Ángeles Verdes', number: '078' },
        { name: 'Cáritas de Guadalajara', number: '36-17-61-22 / 36-17-65-55' },
        { name: 'Centro de Atención Ciudadana', number: '36-68-18-18 / 36-68-18-32' },
        { name: 'Centro de Intervención en Crisis', number: '38-33-38-38' },
        { name: 'Centro de Rehabilitación Infantil Teletón', number: '31-34-2526 / 31-34-25-25' },
        { name: 'Comisión Estatal de Derechos Humanos', number: '36-34-20-21 / 36-34-19-90' },
        { name: 'Violencia Intra Familiar', number: '36-99-38-82' },
        { name: 'Denuncia Municipal Guadalajara', number: '070' },
        { name: 'Denuncia Anónima', number: '089' },
        { name: 'Departamento de Tránsito', number: '32-24-84-84' },
        { name: 'Reporte de Fugas GAS L.P.', number: '36-68-38-00' },
        { name: 'DIF Guadalajara', number: '38-48-50-00' },
        { name: 'Drogadictos Anónimos (24 horas)', number: '36-96-00-23' },
        { name: 'I.S.S.S.T.E.', number: '36-33-01-03 / 36-33-00-44' },
        { name: 'IMSS', number: '38-23-92-61 / 38-12-48-68' },
        { name: 'Instituto Jalisciense de Salud Mental', number: '36-33-93-83' },
        { name: 'Instituto Municipal de la Mujer', number: '36-38-52-00' },
        { name: 'Locatel (24 horas)', number: '31-34-49-82' },
        { name: 'Neuróticos Anónimos (24 horas)', number: '36-38-90-55' },
        { name: 'Procuraduría Federal del Consumidor', number: '36-15-73-83 / 36-15-73-93' },
      ]
    }
  ];

  const helpCenters = [
    {
      name: 'Instituto Jalisciense de las Mujeres',
      address: 'Miguel Blanco No.883, 5to. Piso, Col. Centro, C.P. 44100, Guadalajara, Jalisco.',
      services: 'Asesoría legal, psicológica y apoyo integral',
      phone: ' 36583170 Ext 50628'
    },
    {
      name: 'Centro de Justicia para las Mujeres, Guadalajara',
      address: 'C. Alvaro Alcazar 5869, Jardines Alcalde, 44298 Guadalajara, Jal.',
      services: 'Atención integral para mujeres en situación de violencia',
      phone: '33-3668-1880'
    },
    {
      name: 'DIF Guadalajara',
      address: 'Av. Gral. Eulogio Parra 2539, Lomas de Guevara, 44679 Guadalajara, Jal.',
      services: 'Apoyo social y protección a grupos vulnerables',
      phone: '3338485000'
    }
  ];

  const handleCall = (number) => {
    const cleanNumber = number.replace(/[-\s]/g, '').split('/')[0].trim();
    Alert.alert(
      'Llamar',
      `¿Deseas llamar al ${number}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar', onPress: () => Linking.openURL(`tel:${cleanNumber}`) }
      ]
    );
  };

  const renderEmergencyItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.emergencyItem}
      onPress={() => handleCall(item.number)}
      activeOpacity={0.8}
    >
      <View style={styles.emergencyInfo}>
        <Text style={styles.emergencyName}>{item.name}</Text>
        <Text style={styles.emergencyNumber}>{item.number}</Text>
      </View>
      <View style={styles.callIconContainer}>
        <Ionicons name="call" size={18} color="white" />
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }) => (
    <View style={styles.emergencySectionHeader}>
      <Text style={styles.emergencySectionTitle}>{section.title}</Text>
    </View>
  );

  const renderSection = (title, content, key) => (
    <View style={styles.section} key={key}>
      <TouchableOpacity
        style={[
          styles.sectionHeaderButton,
          expandedSection === key && styles.sectionHeaderButtonActive
        ]}
        onPress={() => toggleSection(key)}
        activeOpacity={0.8}
      >
        <View style={styles.sectionHeaderContent}>
          <View style={styles.sectionIconContainer}>
            {getSectionIcon(key)}
          </View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons
          name={expandedSection === key ? 'chevron-up' : 'chevron-down'}
          size={22}
          color="#49688d"
        />
      </TouchableOpacity>
      
      {expandedSection === key && (
        <View style={styles.sectionContent}>
          {content}
        </View>
      )}
    </View>
  );

  const getSectionIcon = (sectionKey) => {
    const icons = {
      derechos: 'shield-checkmark',
      denuncia: 'document-text',
      centros: 'business',
      emergencia: 'alert-circle',
      prevencion: 'heart'
    };
    return <Ionicons name={icons[sectionKey]} size={20} color="#49688d" />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Módulo Informativo</Text>
          <Text style={styles.subtitle}>
            Información sobre derechos, procedimientos y recursos de ayuda para mujeres y grupos vulnerables en Guadalajara 2025
          </Text>
        </View>

        {renderSection('Derechos Fundamentales', (
          <View style={styles.contentContainer}>
            <Text style={styles.paragraph}>
              Toda persona tiene derecho a una vida libre de violencia. En Jalisco, las leyes protegen especialmente a mujeres, niñas, niños, adolescentes, personas adultas mayores, personas con discapacidad y comunidad LGBTQ+.
            </Text>
            <View style={styles.highlightCard}>
              <Text style={styles.highlightTitle}>Derechos específicos:</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Derecho a la integridad física, psicológica y sexual</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Derecho a la igualdad y no discriminación</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Derecho al acceso a la justicia</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Derecho a la protección institucional</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Derecho a la información y asesoría legal</Text>
                </View>
              </View>
            </View>
          </View>
        ), 'derechos')}

        {renderSection('Procedimientos de Denuncia', (
          <View style={styles.contentContainer}>
            <View style={styles.highlightCard}>
              <Text style={styles.highlightTitle}>Pasos para presentar una denuncia:</Text>
              <View style={styles.stepsContainer}>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Acudir a cualquier Ministerio Público o Centro de Justicia para Mujeres</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Proporcionar información detallada de los hechos</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Solicitar medidas de protección si es necesario</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <Text style={styles.stepText}>Recibir seguimiento del caso</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.highlightCard}>
              <Text style={styles.highlightTitle}>¿Qué necesitas llevar?</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Identificación oficial</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Datos del agresor (si se conocen)</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Evidencias (mensajes, fotos, testigos)</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Información detallada de los hechos</Text>
                </View>
              </View>
            </View>
          </View>
        ), 'denuncia')}

        {renderSection('Centros de Ayuda', (
          <View style={styles.contentContainer}>
            {helpCenters.map((center, index) => (
              <View key={index} style={styles.helpCard}>
                <View style={styles.helpCardHeader}>
                  <Ionicons name="business" size={20} color="#49688d" />
                  <Text style={styles.helpTitle}>{center.name}</Text>
                </View>
                <View style={styles.helpCardContent}>
                  <View style={styles.helpInfo}>
                    <Ionicons name="location" size={14} color="#7f8c8d" />
                    <Text style={styles.helpText}>{center.address}</Text>
                  </View>
                  <View style={styles.helpInfo}>
                    <Ionicons name="list" size={14} color="#7f8c8d" />
                    <Text style={styles.helpText}>{center.services}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.callButton}
                    onPress={() => handleCall(center.phone)}
                  >
                    <Ionicons name="call" size={16} color="white" />
                    <Text style={styles.callButtonText}>{center.phone}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ), 'centros')}

        {renderSection('Contactos de Emergencia', (
          <View style={styles.contentContainer}>
            <Text style={styles.paragraph}>
              En caso de emergencia, contacta inmediatamente a alguno de estos servicios:
            </Text>
            <SectionList
              sections={emergencyData}
              keyExtractor={(item, index) => item.name + index}
              renderItem={renderEmergencyItem}
              renderSectionHeader={renderSectionHeader}
              scrollEnabled={false}
            />
          </View>
        ), 'emergencia')}

        {renderSection('Prevención y Autocuidado', (
          <View style={styles.contentContainer}>
            <View style={styles.highlightCard}>
              <Text style={styles.highlightTitle}>Medidas de prevención:</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Comparte tu ubicación con personas de confianza</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Guarda evidencia de situaciones de riesgo</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Conoce las rutas de escape en tus lugares frecuentes</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Ten números de emergencia guardados</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Confía en tu intuición</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.highlightCard}>
              <Text style={styles.highlightTitle}>Recursos de autocuidado:</Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Terapia psicológica gratuita en centros de salud</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Grupos de apoyo comunitarios</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Apps de seguridad personal</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>Redes de apoyo vecinales</Text>
                </View>
              </View>
            </View>
          </View>
        ), 'prevencion')}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Para más información:
          </Text>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://www.jalisco.gob.mx/https:/jalisco.gob.mx/api/atencion-ciudadana')}
          >
            <Ionicons name="link" size={16} color="#49688d" />
            <Text style={styles.linkText}>Atención ciudadana en Jalisco</Text>
          </TouchableOpacity>
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
  scrollContainer: {
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
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  sectionHeaderButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  sectionHeaderButtonActive: {
    backgroundColor: '#f8f9fa',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIconContainer: {
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    padding: 4,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5d6d7e',
    marginBottom: 16,
    fontWeight: '400',
  },
  highlightCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#49688d',
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#49688d',
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#5d6d7e',
    lineHeight: 20,
    fontWeight: '400',
  },
  stepsContainer: {
    marginBottom: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#49688d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#5d6d7e',
    lineHeight: 20,
    fontWeight: '400',
  },
  helpCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  helpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  helpCardContent: {
    padding: 16,
  },
  helpInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#5d6d7e',
    marginLeft: 8,
    lineHeight: 18,
  },
  callButton: {
    flexDirection: 'row',
    backgroundColor: '#27ae60',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  callButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  emergencySectionHeader: {
    backgroundColor: '#2c3e50',
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  emergencySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  emergencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyName: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
    fontWeight: '500',
  },
  emergencyNumber: {
    fontSize: 15,
    color: '#e74c3c',
    fontWeight: '700',
  },
  callIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  footer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#49688d',
  },
  footerText: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  linkText: {
    fontSize: 16,
    color: '#49688d',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default Modulo_Informativo;
