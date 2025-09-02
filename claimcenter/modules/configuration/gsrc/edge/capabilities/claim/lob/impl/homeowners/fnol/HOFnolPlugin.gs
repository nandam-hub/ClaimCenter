package edge.capabilities.claim.lob.impl.homeowners.fnol
uses edge.capabilities.claim.lob.fnol.ILobFnolPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.util.mapping.Mapper
uses edge.util.mapping.RefUpdater
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.capabilities.claim.lob.impl.homeowners.fnol.dto.HOFnolLobExtensionDTO
uses edge.capabilities.claim.lob.impl.homeowners.fnol.dto.PropertyFireDamageDTO
uses edge.capabilities.claim.lob.impl.homeowners.fnol.dto.PropertyWaterDamageDTO
uses edge.di.annotations.InjectableNode

/**
 * Homeowners extension for the fnol plugin.
 */
class HOFnolPlugin implements ILobFnolPlugin <HOFnolLobExtensionDTO, HOFnolLobExtensionDTO> {

  var _mapper : Mapper as Mapper
  var _waterDamageUpdater : RefUpdater<Claim,PropertyWaterDamage,PropertyWaterDamageDTO>
  var _fireDamageUpdater : RefUpdater<Claim,PropertyFireDamage,PropertyFireDamageDTO>

  @InjectableNode
  construct(authzProvider:IAuthorizerProviderPlugin) {
    _waterDamageUpdater = new RefUpdater<Claim,PropertyWaterDamage,PropertyWaterDamageDTO>(authzProvider){
      : ToCreate = \ claim,d -> new PropertyWaterDamage(),
      : AllowedValues = \ claim -> { return {claim.PropertyWaterDamage} }

    }
    _fireDamageUpdater = new RefUpdater<Claim,PropertyFireDamage,PropertyFireDamageDTO>(authzProvider){
        : ToCreate = \ claim,d -> new PropertyFireDamage(),
        : AllowedValues = \ claim -> { return {claim.PropertyFireDamage} }
  }
    _mapper = new Mapper(authzProvider)
  }

  override function toDTO(claim : Claim) : HOFnolLobExtensionDTO {
    if (claim.Policy.PolicyType != PolicyType.TC_HOPHOMEOWNERS) {
      return null
    }

    final var res = new HOFnolLobExtensionDTO()
    res.PropertyFireDamage = _mapper.mapRef(claim.PropertyFireDamage, \ d -> fireToDTO(claim.PropertyFireDamage))
    res.PropertyWaterDamage = _mapper.mapRef(claim.PropertyWaterDamage, \ d -> waterToDTO(d))
    return res
  }


  override function updateClaim(claim : Claim, dto : HOFnolLobExtensionDTO, isInit : boolean) {
    applyClaimChanges(claim, dto)
  }

  override function submitClaim(claim: Claim, dto: HOFnolLobExtensionDTO) {
    applyClaimChanges(claim, dto)
  }

  private function applyClaimChanges(claim : Claim, dto : HOFnolLobExtensionDTO) {
    if (claim.Policy.PolicyType != PolicyType.TC_HOPHOMEOWNERS) {
      return
    }

    claim.PropertyWaterDamage = _waterDamageUpdater.updateRef(claim, dto.PropertyWaterDamage, \ e,d -> updateWaterDamage(e,d) )
    claim.PropertyFireDamage = _fireDamageUpdater.updateRef(claim, dto.PropertyFireDamage, \e,d -> updateFireDamage(e,d))
  }

  /**
   * Converts water damage into the DTO.
   */
  protected function waterToDTO(damage : PropertyWaterDamage) : PropertyWaterDamageDTO {
    final var res = new PropertyWaterDamageDTO()
    res.PublicID = damage.PublicID
    res.HasWaterBeenTurnedOff = damage.HasWaterBeenTurnedOff
    res.IsRoofProtected = damage.IsRoofProtected
    res.WaterSource = damage.WaterSource
    return res
  }



  /**
   * Updates property water damage.
   */
  protected function updateWaterDamage(damage : PropertyWaterDamage, dto : PropertyWaterDamageDTO) {
    damage.WaterSource = dto.WaterSource
    damage.HasWaterBeenTurnedOff = dto.HasWaterBeenTurnedOff
    damage.IsRoofProtected = dto.IsRoofProtected
  }


  /**
   * Converts fire damage into DTO.
   */
  protected function fireToDTO(damage : PropertyFireDamage) : PropertyFireDamageDTO {
    final var dto = new PropertyFireDamageDTO()
    dto.PublicID = damage.PublicID
    dto.FireSource = damage.FireSource
    dto.HowWasFireDiscovered = damage.HowWasFireDiscovered
    dto.IsHomeHabitable = damage.IsHomeHabitable
    dto.IsHomeSecure  = damage.IsHomeSecure
    return dto
  }


  /**
   * Updates fire damage of the claim.
   */
  protected function updateFireDamage(damage : PropertyFireDamage, dto : PropertyFireDamageDTO) {
    damage.FireSource = dto.FireSource
    damage.HowWasFireDiscovered = dto.HowWasFireDiscovered
    damage.IsHomeHabitable = dto.IsHomeHabitable
    damage.IsHomeSecure = dto.IsHomeSecure
  }

}
