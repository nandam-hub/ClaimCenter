package gw.rest.ext.cc.admin.v1.assignablequeue

uses gw.rest.core.cc.admin.v1.assignablequeue.AssignableQueuesCoreResource
uses gw.rest.ext.cc.admin.v1.group.GroupExtResource

@Export
class AssignableQueuesExtResource extends AssignableQueuesCoreResource<GroupExtResource> {

}