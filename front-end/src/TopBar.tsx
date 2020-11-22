import React from 'react'
import {AppBar, Toolbar, Avatar, Button, Menu, MenuItem} from '@material-ui/core'
import { Account } from 'mdi-material-ui'
import { css } from 'emotion'
import logo from './images/logo.png'
import { ApplicationContext } from "./ApplicationContext";

export default function TopBar() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (<AppBar position="static">
    <Toolbar>
      <div
          className={css`flex: 1`}
      >
        <img
            src={logo}
            width='250px'
            alt='Grow with the Flow'
        />
      </div>
      <a
          className={css`
          display: flex;
          align-items: center;
        `}
      >
        <ApplicationContext.Consumer>
          {({keycloak, toggleShowModal }) =>
              <>{ keycloak &&
              <><Button
                  aria-controls="user=menu"
                  aria-haspopup="true"
                  color="secondary"
                  onClick={handleClick}
                  className={css`margin-right: 10px !important;`}
              >
                {keycloak.tokenParsed ? keycloak.tokenParsed.name : ""}
              </Button>
                <Menu
                    getContentAnchorEl={null}
                    anchorOrigin={{
                      horizontal: "left",
                      vertical: "bottom",
                    }}
                    id="simple-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                  <MenuItem onClick={() => { toggleShowModal(); handleClose(); }}>My plots</MenuItem>
                  <MenuItem onClick={() => keycloak.logout()}>Logout</MenuItem>
                </Menu></>}
              </>
          }
        </ApplicationContext.Consumer>
        <Avatar className={css`background-color: #ba68c8 !important;`}>
          <Account/>
        </Avatar>
      </a>
    </Toolbar>
  </AppBar>)
}