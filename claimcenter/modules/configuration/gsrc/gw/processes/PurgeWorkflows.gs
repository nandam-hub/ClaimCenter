/**
 * This will delete the completed workflows older than the specified days.  This will delete any
 * work items, log messages, and the workflow itself. It does not deal with UserRoleAssignment nor
 * Activity (though it does set the Activity's reference to the workflow to null) and it does not
 * handle added foreign keys by default.  The customer can add foreign key extensions and links
 * using the ILinkPropertyInfo arguments stubbed out below.
 *
 * This is a permanent delete, as opposed to just retiring the workflow.
 *
 * @param WorkflowPurgeDaysOld the number of days that have passed since the last update of the workflow
 *
 * This executes directly against the database, bypassing global cache.
 */
package gw.processes

uses gw.api.system.PLConfigParameters
uses gw.api.admin.WorkflowUtil
uses gw.api.upgrade.Coercions
uses gw.entity.ILinkPropertyInfo

@Export
class PurgeWorkflows extends BatchProcessBase
{
  var _succDays = PLConfigParameters.WorkflowPurgeDaysOld.Value

  construct() {
    this(null)
  }
  
  construct(arguments : Object[]) {
    super(TC_PURGEWORKFLOWS)
    if (arguments != null) {
      _succDays = arguments[1] != null ? (Coercions.makeIntFrom(arguments[1])) : _succDays
    }
  }

  override property get Description() : String {
    return "purge(daysOld=${_succDays})"
  }

  override function doWork() : void {
    /**
     *  Array of {@link ILinkPropertyInfo} references to _delete_ when Workflow is deleted.
     *  Note: {@link ILinkPropertyInfo} implements for a foreign key link relationship.
     *
     *  Examples:
     *  - Add _WorkflowWorkItem_ to array of objects to delete
     *  <pre>
     *    var deleteObjects = new ILinkPropertyInfo[1]
     *    deleteObjects[0](entity.WorkflowWorkItem.WORKFLOW_PROP.get())
     *  </pre>
     *  - Add _WorkflowLogEntry_ to array of objects to delete
     *  <pre>
     *    deleteObjects[0](WorkflowLogEntry.WORKFLOW_PROP.get())
     *  </pre>
     *  - Add _OwnerLinkProperty_ via edgeForeignKey to array of objects to delete
     *  <pre>
     *    deleteObjects[0](asIEdgeLinkPropertyInfoInternal(asILinkPropInfoInternal(Workflow.CALLER_PROP.get()).asEdgeLink()).getOwnerLinkProperty())
     *  </pre>
     *  - Add _ForeignEntityLink_ to array of objects to delete
     *  <pre>
     *    deleteObjects[0](asIEdgeLinkPropertyInfoInternal(asILinkPropInfoInternal(Workflow.CALLER_PROP.get()).asEdgeLink()).getForeignEntityLinkProperty())
     *  </pre>
     */
    var deleteObjects = new ILinkPropertyInfo[0]

    /**
     *  Array of {@link ILinkPropertyInfo} references to _update_ to NULL when Workflow is deleted.
     *  Note: {@link ILinkPropertyInfo} implements for a foreign key link relationship.
     *
     *  Examples:
     *  - Add _Activity_ foreignKey reference to _Workflow_ to array of properties to update to NULL
     *  <pre>
     *    var updateReferences = new ILinkPropertyInfo[1]
     *    updateReferences[0](entity.Activity.WORKFLOW_PROP.get())
     *  </pre>
     */
    var updateReferences = new ILinkPropertyInfo[0]

    /**
     *  Array of {@link ILinkPropertyInfo} references to links to _delete_ when Workflow is deleted.
     *  Note: {@link ILinkPropertyInfo} implements for a foreign key link relationship.
     */
    var deleteLinks = new ILinkPropertyInfo[0]

    OperationsCompleted = WorkflowUtil.deleteOldWorkflowsFromDatabase(_succDays, updateReferences, deleteObjects, deleteLinks)
  }
}
