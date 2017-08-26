
/* IMPORT */

import * as _ from 'lodash';
import confMerge from 'conf-merge';
import * as JSON5 from 'json5';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import Providers from './providers';
import Utils from './utils';

/* CONFIG */

const Config = {

  getDefaults () {

    const defaults: any = {},
          rootPath = Utils.folder.getRootPath ();

    if ( rootPath ) defaults.configPath = path.join ( rootPath, '.vscode', 'commands.json' );

    return defaults;

  },

  getExtension ( extension = 'commands' ) {

    const config = vscode.workspace.getConfiguration ().get ( extension );

    if ( !config['configPath'] ) delete config['configPath'];

    return config;

  },

  async getFile ( filepath ) {

    const content = await Utils.file.read ( filepath );

    if ( !content || !content.trim () ) return;

    const config: any = _.attempt ( JSON5.parse, content );

    if ( _.isError ( config ) ) {

      const option = await vscode.window.showErrorMessage ( '[Commands] Your configuration file contains improperly formatted JSON', { title: 'Overwrite' }, { title: 'Edit' } );

      if ( option && option.title === 'Overwrite' ) {

        await Utils.file.write ( filepath, '{}' );

        return {};

      } else {

        if ( option && option.title === 'Edit' ) {

          Utils.file.open ( filepath );

        }

        throw new Error ( 'Can\'t read improperly formatted configuration file' );

      }

    }

    return config;

  },

  async get () {

    const defaults = Config.getDefaults (),
          extension: any = Config.getExtension (),
          configPath: string = extension.configPath || defaults.configPath,
          config = configPath && await Config.getFile ( configPath );

    return confMerge ( {}, defaults, extension, config ) as any;

  },

  async write ( filepath, config ) {

    const newConfig = _.omit ( config, ['configPath'] );

    await Utils.file.write ( filepath, JSON.stringify ( newConfig, undefined, 2 ) );

    return Providers.refresh ();

  }

};

/* EXPORT */

export default Config;
