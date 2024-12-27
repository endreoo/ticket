import React, { useState } from 'react';
import { 
  CreditCard, 
  Info, 
  DollarSign, 
  FileText, 
  Edit3, 
  XCircle 
} from 'lucide-react';
import type { VirtualCard } from '../../types';
import { InfoModal } from '../modals/InfoModal';
import { CardDetailsModal } from '../modals/CardDetailsModal';
import { ChargeCardModal } from '../modals/ChargeCardModal';
import { NotesModal } from '../modals/NotesModal';
import { AdjustAmountModal } from '../modals/AdjustAmountModal';
import { DoNotChargeModal } from '../modals/DoNotChargeModal';

interface VirtualCardActionsProps {
  card: VirtualCard;
}

export function VirtualCardActions({ card }: VirtualCardActionsProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <div className="flex space-x-2">
        <button
          title="Info"
          onClick={() => setActiveModal('info')}
          className="text-blue-600 hover:text-blue-900"
        >
          <Info className="h-5 w-5" />
        </button>
        <button
          title="Card Details"
          onClick={() => setActiveModal('cardDetails')}
          className="text-blue-600 hover:text-blue-900"
        >
          <CreditCard className="h-5 w-5" />
        </button>
        <button
          title="Charge Card"
          onClick={() => setActiveModal('charge')}
          className="text-green-600 hover:text-green-900"
        >
          <DollarSign className="h-5 w-5" />
        </button>
        <button
          title="Notes"
          onClick={() => setActiveModal('notes')}
          className="text-gray-600 hover:text-gray-900"
        >
          <FileText className="h-5 w-5" />
        </button>
        <button
          title="Adjust Amount"
          onClick={() => setActiveModal('adjust')}
          className="text-yellow-600 hover:text-yellow-900"
        >
          <Edit3 className="h-5 w-5" />
        </button>
        <button
          title="Do not charge"
          onClick={() => setActiveModal('doNotCharge')}
          className="text-red-600 hover:text-red-900"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>

      <InfoModal
        isOpen={activeModal === 'info'}
        onClose={closeModal}
        card={card}
      />
      <CardDetailsModal
        isOpen={activeModal === 'cardDetails'}
        onClose={closeModal}
        card={card}
      />
      <ChargeCardModal
        isOpen={activeModal === 'charge'}
        onClose={closeModal}
        card={card}
      />
      <NotesModal
        isOpen={activeModal === 'notes'}
        onClose={closeModal}
        card={card}
      />
      <AdjustAmountModal
        isOpen={activeModal === 'adjust'}
        onClose={closeModal}
        card={card}
      />
      <DoNotChargeModal
        isOpen={activeModal === 'doNotCharge'}
        onClose={closeModal}
        card={card}
      />
    </>
  );
}