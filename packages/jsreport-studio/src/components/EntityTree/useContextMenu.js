import { useState, useEffect, useCallback } from 'react'

export default function useContextMenu (contextMenuRef) {
  const [contextMenu, setContextMenu] = useState(null)

  const showContextMenu = useCallback((ev, entity) => {
    ev.preventDefault()
    ev.stopPropagation()

    // prevents handling context menu clicks when the menu is shown
    if (contextMenuRef.current && contextMenuRef.current.contains(ev.target)) {
      return
    }

    const newContextMenu = {}

    if (entity) {
      newContextMenu.id = entity._id
      newContextMenu.pointCoordinates = null
    } else {
      newContextMenu.id = '__ROOT__'
      newContextMenu.pointCoordinates = { x: ev.clientX, y: ev.clientY }
    }

    setContextMenu(newContextMenu)
  }, [contextMenuRef])

  const clearContextMenu = useCallback(() => {
    setContextMenu((prev) => {
      if (prev == null) {
        return prev
      }

      return null
    })
  }, [])

  useEffect(() => {
    function tryClearFromClick (ev) {
      const LEFT_CLICK = 1
      const button = ev.which || ev.button

      if (!contextMenu || !contextMenuRef.current) {
        return
      }

      if (ev.target.type === 'file') {
        return
      }

      ev.preventDefault()

      if (!contextMenuRef.current.contains(ev.target)) {
        ev.stopPropagation()

        // handle quirk in firefox that fires and additional click event during
        // contextmenu event, this code prevents the context menu to
        // immediately be closed after being shown in firefox
        if (button === LEFT_CLICK) {
          clearContextMenu()
        }
      }
    }

    window.addEventListener('click', tryClearFromClick, true)

    return () => {
      window.removeEventListener('click', tryClearFromClick, true)
    }
  }, [contextMenuRef, contextMenu, clearContextMenu])

  return {
    contextMenu,
    showContextMenu,
    clearContextMenu
  }
}
