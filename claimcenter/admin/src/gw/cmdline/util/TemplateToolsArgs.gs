package gw.cmdline.util

uses gw.lang.cli.*

class TemplateToolsArgs {

  /**
   * Specify a directory so that relative paths can be used for file arguments.
   */
   static var _workingDir : String as WorkingDir

  /**
   * Convert a single file.
   */
   static var _convertFile : String as ConvertFile

  /**
   * Convert all the templates in a directory.
   */
   static var _convertDir : String as ConvertDir

  /**
   * Validate a single document template.
   */
   static var _validateDocTemplate : String as ValidateDocTemplate

  /**
   * Validate a single note template.
   */
   static var _validateNoteTemplate : String as ValidateNoteTemplate
   
  /**
   * Validate a single email template.
   */
   static var _validateEmailTemplate : String as ValidateEmailTemplate
   
  /**
   * Validate all templates.
   */
   static var _validateAllTemplates : Boolean as ValidateAllTemplates
   
  /**
   * Validate all document templates.
   */
   static var _validateAllDocTemplates : Boolean as ValidateAllDocTemplates
   
  /**
   * Validate all email templates.
   */
   static var _validateAllEmailTemplates : Boolean as ValidateAllEmailTemplates
   
  /**
   * Validate all note templates.
   */
   static var _validateAllNoteTemplates : Boolean as ValidateAllNoteTemplates
   
  /**
   * List all templates available to be validated.
   */
   static var _listAllTemplates : Boolean as ListAllTemplates
   
  /**
   * List all document templates available to be validated.
   */
   static var _listDocTemplates : Boolean as ListDocTemplates

  /**
   * List all note templates available to be validated.
   */
   static var _listNoteTemplates : Boolean as ListNoteTemplates
   
  /**
   * List all email templates available to be validated.
   */
   static var _listEmailTemplates : Boolean as ListEmailTemplates
   
  /**
   * Import context objects, form field groups, and form fields into a single template.
   */
   static var _importFiles : String[] as ImportFiles

  /**
   * Import context objects and form fields into all the templates in a directory.
   */
   static var _importDir : String[] as ImportDir

  /**
   * The root server URL to access.
   */
  @DefaultValue( 
          "http://localhost:8080/cc" )
  static var _server : String as Server

  /**
   * The user to log in as.
   */
  @DefaultValue( "su" )
  static var _user : String as User

  /**
   * The password to use.
   */
  @Required
  static var _password : String as Password

}
