package gw.api.assignment

@Export
class ExposureAssignSimilarMethodsImpl extends AssignSimilarMethodsBaseImpl<Exposure> {
  
  construct(owner : Exposure) {
    super(owner)
  }
  
  override function isSimilar(exposure : Exposure) : boolean {
    return exposure.CoverageSubType != null && Owner.CoverageSubType == exposure.CoverageSubType;
  }
}