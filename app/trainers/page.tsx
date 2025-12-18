'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { MainLayout } from '@/components/layout/MainLayout';
import { Trainer } from '@/types';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  User,
  Search,
  X
} from 'lucide-react';

export default function TrainersPage() {
  const { gym, trainers, addTrainer, updateTrainer, deleteTrainer, classes } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const filteredTrainers = trainers.filter(trainer =>
    trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (trainer?: Trainer) => {
    if (trainer) {
      setEditingTrainer(trainer);
      setFormData({
        name: trainer.name,
        email: trainer.email || '',
        phone: trainer.phone || '',
      });
    } else {
      setEditingTrainer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTrainer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    if (!gym) return;

    if (editingTrainer) {
      await updateTrainer(editingTrainer.id, {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });
    } else {
      await addTrainer({
        gymId: gym.id,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });
    }

    handleCloseModal();
  };

  const handleDelete = async (trainer: Trainer) => {
    // Verificar si el entrenador tiene clases asignadas
    const trainerClasses = classes.filter(c => c.trainerId === trainer.id);
    
    if (trainerClasses.length > 0) {
      const classNames = trainerClasses.map(c => c.name).join(', ');
      if (!confirm(`Este entrenador tiene ${trainerClasses.length} clase(s) asignada(s): ${classNames}. ¿Estás seguro de que deseas eliminarlo?`)) {
        return;
      }
    } else {
      if (!confirm(`¿Estás seguro de que deseas eliminar a ${trainer.name}?`)) {
        return;
      }
    }

    await deleteTrainer(trainer.id);
  };

  const getTrainerClassCount = (trainerId: string) => {
    return classes.filter(c => c.trainerId === trainerId).length;
  };

  if (!gym) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Cargando entrenadores...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-50 mb-1 sm:mb-2">Entrenadores</h1>
            <p className="text-sm sm:text-base text-gray-400">Gestiona los entrenadores de tu gimnasio</p>
          </div>
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Agregar Entrenador</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Buscar entrenadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 sm:pl-10 text-sm"
          />
        </div>

        {/* Trainers List */}
        {filteredTrainers.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
              {searchTerm ? 'No se encontraron entrenadores' : 'No hay entrenadores'}
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              {searchTerm
                ? 'Intenta con otro término de búsqueda'
                : 'Comienza agregando tu primer entrenador'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredTrainers.map((trainer) => {
              const classCount = getTrainerClassCount(trainer.id);
              return (
                <Card key={trainer.id} className="p-4 sm:p-5 hover:border-primary-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-50">{trainer.name}</h3>
                        {classCount > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                            {classCount} {classCount === 1 ? 'clase' : 'clases'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3 sm:mb-4">
                    {trainer.email && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{trainer.email}</span>
                      </div>
                    )}
                    {trainer.phone && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{trainer.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 sm:pt-4 border-t border-dark-700/50">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenModal(trainer)}
                      className="flex-1 text-xs sm:text-sm"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline ml-1">Editar</span>
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(trainer)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {filteredTrainers.length > 0 && (
          <Card className="p-4 bg-dark-800/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total de entrenadores:</span>
              <span className="text-gray-50 font-semibold">{filteredTrainers.length}</span>
            </div>
          </Card>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTrainer ? 'Editar Entrenador' : 'Agregar Entrenador'}
      >
        <div className="space-y-4">
          <Input
            label="Nombre completo"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Juan Pérez"
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="entrenador@gimnasio.com"
          />

          <Input
            label="Teléfono"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+57 300 123 4567"
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="flex-1"
            >
              {editingTrainer ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}


