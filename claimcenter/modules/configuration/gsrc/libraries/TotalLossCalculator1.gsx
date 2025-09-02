package libraries

uses gw.config.LOBAbstraction

@Export
enhancement TotalLossCalculator1 : entity.Exposure {

  function totalLossCalculatorPreUpdate() { 	
    // only applies to Auto LOB
    if (LOBAbstraction.ForClaim.ForLossType.isAuto(this.Claim) and this.VehicleIncident != null) {
      this.VehicleIncident.TotalLossCalculatorPreUpdate()
    }
  }
}