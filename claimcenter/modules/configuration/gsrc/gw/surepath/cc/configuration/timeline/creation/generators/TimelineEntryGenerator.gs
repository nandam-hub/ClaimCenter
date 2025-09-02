package gw.surepath.cc.configuration.timeline.creation.generators

uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation


uses java.util.Date

/**
 * Interface for all timeline entry generators.
 */
@IncludeInDocumentation
public interface TimelineEntryGenerator {
  public function generateEntries(claim: Claim, date: Date): List<TimelineEntry_SP>
  public function generateEntries(bundle : Bundle, claim : Claim) : List<TimelineEntry_SP>
}
