package gw.api.matter

@Export
public class MatterCloseReopenNoteMethodsImpl implements MatterCloseReopenNoteMethods {

  private var _closeReopenInfo : MatterCloseReopenInfo

  construct( info : entity.MatterCloseReopenInfo ) {
    _closeReopenInfo = info
  }

  override property get LitigationNoteTopic() : NoteTopicType {
    return NoteTopicType.TC_LITIGATION;
  }
}
