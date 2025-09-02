package edge.capabilities.claim.fnol.util

uses com.guidewire.cc.api.util.NewClaimWizardUtilInternal
uses edge.capabilities.claim.fnol.dto.FnolDTO


@SuppressWarnings("HiddenPackageReference")
class DraftClaimHelper {
  static function runInDraftClaimContext( handler(): FnolDTO): FnolDTO {
    var previousClaimWizardDraftSaveState = NewClaimWizardUtilInternal.InNewClaimWizardDraftSave
    /* This reference to a com.guidewire class by Guidewire EDGE APIs approved by Guidewire Development. */
    NewClaimWizardUtilInternal.InNewClaimWizardDraftSave = true
    final var result = handler()
    /* This reference to a com.guidewire class by Guidewire EDGE APIs approved by Guidewire Development. */
    NewClaimWizardUtilInternal.InNewClaimWizardDraftSave = previousClaimWizardDraftSaveState
    return result
  }
}
