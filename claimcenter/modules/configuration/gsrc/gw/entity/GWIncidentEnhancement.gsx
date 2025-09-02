package gw.entity

uses gw.api.locale.DisplayKey

@Export
enhancement GWIncidentEnhancement : entity.Incident {
  
  /**
   * Gets the incident's display name prefixed with the incidents type
   */
  property get TypePrefixedIncidentName(): String {

    var subtype = this.Subtype
    var incidentDisplayName = this.DisplayName
    
    // Incident description has not been added
    if (incidentDisplayName.equals(DisplayKey.get("DisplayName.EmptyAddress")) or incidentDisplayName.equals(DisplayKey.get("Java.DisplayName.NewlyCreated")) or incidentDisplayName.Empty) {
      incidentDisplayName = DisplayKey.get("Web.Incident.NoDescription")

      if(this.Exposures.Count > 0) {
        var incidentExposureType = this.Exposures.first().ExposureType
        if(this.Exposures.allMatch( \ exposure -> exposure.ExposureType == incidentExposureType)) {
          incidentDisplayName = incidentExposureType.DisplayName
        }
      }
    }
    
    if (subtype == typekey.Incident.TC_INCIDENT) {
        return incidentDisplayName
    }
    
    var prefix = ""
    var displayKeyName = "Web.Incident.PrefixName." + subtype.Code
    //noinspection DisplayKeyNotLiteral
    prefix = gw.api.locale.DisplayKey.get(displayKeyName)
    
    if (prefix == displayKeyName) {
      return incidentDisplayName
    }    
    
    return prefix + ": " + incidentDisplayName
  }

  property get AsVehicleIncident() : VehicleIncident {
    return (this typeis VehicleIncident) ? this : null
  }

  property get AsBaggageIncident() : BaggageIncident {
    return (this typeis BaggageIncident) ? this : null
  }

  property get AsInjuryIncident() : InjuryIncident {
    return (this typeis InjuryIncident) ? this : null
  }

  property get AsLivingExpensesIncident() : LivingExpensesIncident {
    return (this typeis LivingExpensesIncident) ? this : null
  }

  property get AsMobilePropertyIncident() : MobilePropertyIncident {
    return (this typeis MobilePropertyIncident) ? this : null
  }

  property get AsOtherStructureIncident() : OtherStructureIncident {
    return (this typeis OtherStructureIncident) ? this : null
  }

  property get AsPropertyContentsIncident() : PropertyContentsIncident {
    return (this typeis PropertyContentsIncident) ? this : null
  }

  property get AsPropertyIncident() : PropertyIncident {
    return (this typeis VehicleIncident) ? this : null
  }

  property get AsTripIncident() : TripIncident {
    return (this typeis TripIncident) ? this : null
  }

  property get AsFixedPropertyIncident() : FixedPropertyIncident {
    return (this typeis FixedPropertyIncident) ? this : null
  }

  property get AsDwellingIncident() : DwellingIncident {
    return (this typeis DwellingIncident) ? this : null
  }

  property get RemovalBlockedByExposure() : boolean {
    return this.Exposures.hasMatch(\e -> e.ClosedOutcome != TC_MISTAKE);
  }
}
