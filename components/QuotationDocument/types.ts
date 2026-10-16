import type { Quotation } from '../../types';

export interface QuotationDocumentActions {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export interface QuotationDocumentProps {
  quotation: Quotation;
  actions: QuotationDocumentActions;
}
