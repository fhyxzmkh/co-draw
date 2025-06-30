import { Injectable } from '@nestjs/common';
import * as Y from 'yjs';

@Injectable()
export class ActiveDocsService {
  private activeDocs = new Map<string, Y.Doc>();

  get(documentId: string): Y.Doc | undefined {
    return this.activeDocs.get(documentId);
  }

  create(documentId: string, initialState?: Uint8Array): Y.Doc {
    const ydoc = new Y.Doc();
    if (initialState) {
      Y.applyUpdate(ydoc, initialState);
    }
    this.activeDocs.set(documentId, ydoc);
    return ydoc;
  }

  destroy(documentId: string) {
    this.activeDocs.get(documentId)?.destroy();
    this.activeDocs.delete(documentId);
  }
}
