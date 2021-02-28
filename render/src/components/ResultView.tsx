function ResultView(props: { children: any }) {
  return (
    <div className="result-view flex-h-v h-full"
      dangerouslySetInnerHTML={{__html: props.children}}>
    </div>
  )
}

export default ResultView