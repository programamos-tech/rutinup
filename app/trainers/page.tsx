'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    trainer: Trainer | null;
    message: string;
  }>({
    isOpen: false,
    trainer: null,
    message: '',
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

  const handleDelete = (trainer: Trainer) => {
    // Verificar si el entrenador tiene clases asignadas
    const trainerClasses = classes.filter(c => c.trainerId === trainer.id);
    
    let message = '';
    if (trainerClasses.length > 0) {
      const classNames = trainerClasses.map(c => c.name).join(', ');
      message = `Este entrenador tiene ${trainerClasses.length} clase(s) asignada(s): ${classNames}. ¿Estás seguro de que deseas eliminarlo?`;
    } else {
      message = `¿Estás seguro de que deseas eliminar a ${trainer.name}?`;
    }
    
    setConfirmDialog({
      isOpen: true,
      trainer,
      message,
    });
  };

  const handleConfirmDelete = async () => {
    if (confirmDialog.trainer) {
      await deleteTrainer(confirmDialog.trainer.id);
      setConfirmDialog({
        isOpen: false,
        trainer: null,
        message: '',
      });
    }
  };

  const getTrainerClassCount = (trainerId: string) => {
    return classes.filter(c => c.trainerId === trainerId).length;
  };

  if (!gym) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600 dark:text-gray-400">Cargando entrenadores...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 min-h-[calc(100vh-200px)] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Entrenadores</h1>
            <p className="text-gray-600 dark:text-gray-400">Gestiona los entrenadores de tu gimnasio</p>
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-500" />
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
          trainers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="w-full max-w-xl text-center">
                <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">
                  Agrega tu primer entrenador
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Los entrenadores son las <strong className="text-gray-900 dark:text-gray-50">personas que imparten clases en tu gimnasio</strong>. Asígnales clases y gestiona su información de contacto.
                </p>
                <div className="flex justify-center">
                  <Button
                    variant="primary"
                    onClick={() => handleOpenModal()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar mi primer entrenador
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center bg-white dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700/50">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
                No se encontraron entrenadores
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Intenta con otro término de búsqueda
              </p>
            </Card>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredTrainers.map((trainer) => {
              const classCount = getTrainerClassCount(trainer.id);
              return (
                <div key={trainer.id} className="bg-white dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700/50 rounded-xl p-5 hover:border-primary-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-500 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-lg">{trainer.name}</h3>
                        {classCount > 0 && (
                          <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">
                            {classCount} {classCount === 1 ? 'clase' : 'clases'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3 sm:mb-4">
                    {trainer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span>{trainer.email}</span>
                      </div>
                    )}
                    {trainer.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{trainer.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-dark-700/50">
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
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {filteredTrainers.length > 0 && (
          <div className="bg-gray-50 dark:bg-dark-800/30 border border-gray-200 dark:border-dark-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total de entrenadores:</span>
              <span className="text-gray-900 dark:text-gray-50 font-semibold">{filteredTrainers.length}</span>
            </div>
          </div>
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({
          isOpen: false,
          trainer: null,
          message: '',
        })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Entrenador"
        message={confirmDialog.message}
        variant="danger"
      />
    </MainLayout>
  );
}





