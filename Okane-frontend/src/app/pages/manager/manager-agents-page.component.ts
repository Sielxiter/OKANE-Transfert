// src/app/pages/manager/manager-agents-page.component.ts
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ManagerDashboardService } from '../../manager/services/manager-dashboard.service';
import {
  ManagerAgentResponse,
  ManagerAgentRequest,
  ManagerAgentUpdateRequest,
} from '../../manager/models/manager-dashboard.models';

@Component({
  selector: 'okane-manager-agents-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <!-- Header avec bouton ajout -->
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Gestion des agents</h2>
        <button
          type="button"
          class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          (click)="openCreateModal()"
        >
          + Nouvel agent
        </button>
      </div>

      <!-- Liste des agents -->
      <section class="rounded-xl border bg-background p-4 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            class="w-full rounded-md border px-3 py-2 text-sm md:max-w-xs"
            placeholder="Rechercher un agent..."
            [(ngModel)]="search"
          />

          <!-- Filtre par statut -->
          <select
            class="w-full rounded-md border px-3 py-2 text-sm md:w-40"
            [(ngModel)]="statusFilter"
          >
            <option value="all">Tous</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
        </div>

        @if (loading) {
          <p class="py-6 text-center text-sm text-muted-foreground">Chargement...</p>
        } @else if (error) {
          <p class="text-sm text-destructive">{{ error }}</p>
        } @else {
          <div class="mt-4 overflow-x-auto">
            <table class="w-full min-w-[800px] text-sm">
              <thead class="text-xs uppercase text-muted-foreground">
                <tr>
                  <th class="px-3 py-2 text-left">Nom complet</th>
                  <th class="px-3 py-2 text-left">Email</th>
                  <th class="px-3 py-2 text-left">Téléphone</th>
                  <th class="px-3 py-2 text-left">Statut</th>
                  <th class="px-3 py-2 text-left">Créé le</th>
                  <th class="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (agent of filteredAgents; track agent.id) {
                  <tr class="border-t">
                    <td class="px-3 py-3 font-medium">{{ agent.prenom }} {{ agent.nom }}</td>
                    <td class="px-3 py-3">{{ agent.email }}</td>
                    <td class="px-3 py-3">{{ agent.telephone || '-' }}</td>
                    <td class="px-3 py-3">
                      <span
                        class="rounded-full px-2 py-1 text-xs font-semibold"
                        [class]="
                          agent.actif
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        "
                      >
                        {{ agent.actif ? 'Actif' : 'Inactif' }}
                      </span>
                    </td>
                    <td class="px-3 py-3">{{ formatDate(agent.creeLe) }}</td>
                    <td class="px-3 py-3 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          class="text-blue-600 hover:text-blue-800"
                          title="Modifier"
                          (click)="openEditModal(agent)"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          class="text-amber-600 hover:text-amber-800"
                          [title]="agent.actif ? 'Désactiver' : 'Activer'"
                          (click)="toggleStatus(agent)"
                        >
                          {{ agent.actif ? '🔴' : '🟢' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-3 py-8 text-center text-sm text-muted-foreground">
                      Aucun agent trouvé.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>

    <!-- Modal Création/Modification -->
    @if (showModal) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="w-full max-w-lg rounded-xl border bg-background p-5 shadow-xl">
          <h3 class="text-lg font-semibold">{{ modalTitle }}</h3>

          <div class="mt-4 space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <label class="text-sm">
                <span class="text-muted-foreground">Prénom *</span>
                <input
                  class="mt-1 w-full rounded-md border px-3 py-2"
                  [(ngModel)]="formData.prenom"
                  placeholder="Prénom"
                />
              </label>
              <label class="text-sm">
                <span class="text-muted-foreground">Nom *</span>
                <input
                  class="mt-1 w-full rounded-md border px-3 py-2"
                  [(ngModel)]="formData.nom"
                  placeholder="Nom"
                />
              </label>
            </div>

            <label class="text-sm">
              <span class="text-muted-foreground">Email *</span>
              <input
                type="email"
                class="mt-1 w-full rounded-md border px-3 py-2"
                [(ngModel)]="formData.email"
                placeholder="agent@example.com"
              />
            </label>

            @if (!isEditMode) {
              <label class="text-sm">
                <span class="text-muted-foreground">Mot de passe *</span>
                <input
                  type="password"
                  class="mt-1 w-full rounded-md border px-3 py-2"
                  [(ngModel)]="formData.motDePasse"
                  placeholder="Au moins 6 caractères"
                />
              </label>
            }

            <label class="text-sm">
              <span class="text-muted-foreground">Téléphone</span>
              <input
                class="mt-1 w-full rounded-md border px-3 py-2"
                [(ngModel)]="formData.telephone"
                placeholder="Téléphone"
              />
            </label>

            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" [(ngModel)]="formData.actif" />
              <span>Compte actif</span>
            </label>
          </div>

          @if (modalError) {
            <p class="mt-3 text-xs text-rose-600">{{ modalError }}</p>
          }

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-md border px-4 py-2 text-sm font-semibold"
              (click)="closeModal()"
            >
              Annuler
            </button>
            <button
              type="button"
              class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              [disabled]="isLoading || !isFormValid()"
              (click)="saveAgent()"
            >
              {{ isLoading ? 'En cours...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ManagerAgentsPageComponent implements OnInit {
  private readonly _service = inject(ManagerDashboardService);
  private readonly _cdr = inject(ChangeDetectorRef);

  agents: ManagerAgentResponse[] = [];
  search = '';
  statusFilter: 'all' | 'actif' | 'inactif' = 'all';
  loading = false;
  error = '';

  showModal = false;
  isEditMode = false;
  editId: number | null = null;
  isLoading = false;
  modalError = '';

  formData: any = {
    prenom: '',
    nom: '',
    email: '',
    motDePasse: '',
    telephone: '',
    actif: true,
  };

  ngOnInit(): void {
    this.loadAgents();
  }

  get filteredAgents(): ManagerAgentResponse[] {
    let filtered = this.agents;

    // Filtre par recherche
    const q = this.search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (a) =>
          `${a.prenom} ${a.nom}`.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.telephone?.includes(q),
      );
    }

    // Filtre par statut
    if (this.statusFilter === 'actif') {
      filtered = filtered.filter((a) => a.actif === true);
    } else if (this.statusFilter === 'inactif') {
      filtered = filtered.filter((a) => a.actif === false);
    }

    return filtered;
  }

  get modalTitle(): string {
    return this.isEditMode ? "Modifier l'agent" : 'Ajouter un agent';
  }

  loadAgents(): void {
    this.loading = true;
    this._service.getAgents().subscribe({
      next: (agents) => {
        this.agents = agents;
        this.loading = false;
        this._cdr.markForCheck();
      },
      error: () => {
        this.error = 'Impossible de charger les agents.';
        this.loading = false;
        this._cdr.markForCheck();
      },
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editId = null;
    this.formData = {
      prenom: '',
      nom: '',
      email: '',
      motDePasse: '',
      telephone: '',
      actif: true,
    };
    this.modalError = '';
    this.showModal = true;
  }

  openEditModal(agent: ManagerAgentResponse): void {
    this.isEditMode = true;
    this.editId = agent.id;
    this.formData = {
      prenom: agent.prenom,
      nom: agent.nom,
      email: agent.email,
      motDePasse: '',
      telephone: agent.telephone || '',
      actif: agent.actif,
    };
    this.modalError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isLoading = false;
    this.modalError = '';
  }

  isFormValid(): boolean {
    if (
      !this.formData.prenom?.trim() ||
      !this.formData.nom?.trim() ||
      !this.formData.email?.trim()
    ) {
      return false;
    }
    if (!this.isEditMode && (!this.formData.motDePasse || this.formData.motDePasse.length < 6)) {
      return false;
    }
    return true;
  }

  saveAgent(): void {
    if (!this.isFormValid()) return;
    this.isLoading = true;
    this.modalError = '';

    if (this.isEditMode && this.editId) {
      const request: ManagerAgentUpdateRequest = {
        prenom: this.formData.prenom,
        nom: this.formData.nom,
        email: this.formData.email,
        telephone: this.formData.telephone,
        actif: this.formData.actif,
      };
      this._service.updateAgent(this.editId, request).subscribe({
        next: () => {
          this.closeModal();
          this.loadAgents();
        },
        error: (err) => {
          this.modalError = err?.error?.message || 'Erreur lors de la modification';
          this.isLoading = false;
          this._cdr.markForCheck();
        },
      });
    } else {
      const request: ManagerAgentRequest = {
        prenom: this.formData.prenom,
        nom: this.formData.nom,
        email: this.formData.email,
        motDePasse: this.formData.motDePasse,
        telephone: this.formData.telephone,
        actif: this.formData.actif,
      };
      this._service.createAgent(request).subscribe({
        next: () => {
          this.closeModal();
          this.loadAgents();
        },
        error: (err) => {
          this.modalError = err?.error?.message || 'Erreur lors de la création';
          this.isLoading = false;
          this._cdr.markForCheck();
        },
      });
    }
  }

  toggleStatus(agent: ManagerAgentResponse): void {
    const action = agent.actif ? 'désactiver' : 'activer';
    if (confirm(`Êtes-vous sûr de vouloir ${action} l'agent ${agent.prenom} ${agent.nom} ?`)) {
      this._service.toggleAgentStatus(agent.id).subscribe({
        next: () => {
          this.loadAgents();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Erreur lors du changement de statut';
          this._cdr.markForCheck();
        },
      });
    }
  }

  formatDate(value: string): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('fr-FR');
  }
}
