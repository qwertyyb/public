import './ListItem.scss';

function ListItem(props: {
  image: string,
  title: string,
  subtitle: string,
  selected: boolean,
  onClick: (event: React.MouseEvent<HTMLInputElement>) => void,
}) {
  const classNames = ['list-item flex']
  if (props.selected) {
    classNames.push('selected')
  }
  return (
    <div className={classNames.join(' ')} onClick={props.onClick}>
      <div className="item-image-wrapper flex-h-v">
        <img src={props.image} alt=""/>
      </div>
      <div className="item-info flex-1 flex-col-center">
        <h3 className="item-title">{props.title}</h3>
        <h5 className="item-subtitle color-666 text-sm text-single-line">{props.subtitle}</h5>
      </div>
    </div>
  )
}

export default ListItem